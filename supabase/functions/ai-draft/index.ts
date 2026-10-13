// Photo → post draft with Gemini (free tier). The API key stays here, never in the browser.
//   POST { images: [{ mime: "image/jpeg", data: "<base64>" }, …] }   (1–3 photos, already compressed by the app)
//   → { title, description, category, condition }
// 20 drafts per person per day (public.bump_ai_usage); over that the app falls back to the manual form.
import { serviceClient } from "../_shared/db.ts";
import { verifyFirebaseToken } from "../_shared/firebase.ts";
import { env, handler, HttpError, json, readJson } from "../_shared/http.ts";

export const CATEGORIES = ["books", "stationery", "furniture", "clothes", "electronics", "kids", "other"] as const;
export const CONDITIONS = ["new", "good", "used"] as const;
const DAILY_LIMIT = 20;
const MAX_IMAGES = 3;
const MAX_B64_PER_IMAGE = 1_500_000; // ≈1.1 MB after decoding; the app sends ~200 KB

const PROMPT = `You help people in Bangladesh give away used things for free. Look at the photo(s) and write a listing.
Reply as JSON only:
- title: Bangla, 5–80 characters, what the item is (e.g. "ক্লাস ৮-এর বইয়ের সেট").
- description: Bangla, one or two short sentences about what is visible and its condition. No phone numbers, prices or addresses.
- category: one of ${CATEGORIES.join(", ")}.
- condition: one of ${CONDITIONS.join(", ")}.
- prohibited: true if the photo shows weapons, drugs, alcohol, live animals, adult content or anything illegal; otherwise false.`;

export interface Draft {
  title: string;
  description: string;
  category: typeof CATEGORIES[number];
  condition: typeof CONDITIONS[number];
}

/** Turns Gemini's reply into a safe draft: wrong enums fall back, text is trimmed, prohibited items are refused. */
export function parseDraft(text: string): Draft {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new HttpError(502, "bad_ai_reply");
  }
  if (raw.prohibited === true) throw new HttpError(422, "prohibited_item");
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const title = str(raw.title, 80);
  if (title.length < 5) throw new HttpError(502, "bad_ai_reply");
  return {
    title,
    description: str(raw.description, 300),
    category: (CATEGORIES as readonly string[]).includes(raw.category as string) ? raw.category as Draft["category"] : "other",
    condition: (CONDITIONS as readonly string[]).includes(raw.condition as string) ? raw.condition as Draft["condition"] : "good",
  };
}

export function geminiBody(images: { mime: string; data: string }[]) {
  return {
    contents: [{
      role: "user",
      parts: [{ text: PROMPT }, ...images.map((i) => ({ inline_data: { mime_type: i.mime, data: i.data } }))],
    }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          category: { type: "STRING", enum: [...CATEGORIES] },
          condition: { type: "STRING", enum: [...CONDITIONS] },
          prohibited: { type: "BOOLEAN" },
        },
        required: ["title", "description", "category", "condition", "prohibited"],
      },
    },
  };
}

if (import.meta.main) {
  Deno.serve(handler(async (req) => {
    const user = await verifyFirebaseToken(req);
    if (!user.emailVerified) throw new HttpError(403, "email_not_verified");

    const body = await readJson<{ images?: { mime?: string; data?: string }[] }>(req, 4_000_000);
    const images = (body.images ?? []).slice(0, MAX_IMAGES).filter((i) =>
      typeof i.data === "string" && i.data.length <= MAX_B64_PER_IMAGE &&
      ["image/jpeg", "image/png", "image/webp"].includes(i.mime ?? "")
    ) as { mime: string; data: string }[];
    if (images.length === 0) throw new HttpError(400, "no_images");

    // Count first, so a failing Gemini call cannot be used to probe without limit.
    const { data: used, error } = await serviceClient().rpc("bump_ai_usage", { p_uid: user.uid });
    if (error) throw error;
    if ((used as number) > DAILY_LIMIT) throw new HttpError(429, "ai_limit");

    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": env("GEMINI_API_KEY"), "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody(images)),
    });
    if (res.status === 429) throw new HttpError(429, "ai_busy", "The free AI quota is used up for now");
    if (!res.ok) throw new HttpError(502, "ai_unavailable");
    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return json(req, parseDraft(data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""));
  }));
}
