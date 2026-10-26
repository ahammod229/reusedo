import { Router } from "express";
import multer from "multer";
import { getSupabaseClient } from "../database/client";
import { HttpError, ah, badRequest, must } from "../lib/http";
import { integration } from "../lib/integrations";
import { userLimit } from "../lib/limits";
import { type GeneralSettings, flagOn, getSetting } from "../lib/settings";
import { me, optionalAuth, requireAuth } from "../middlewares/auth.middleware";
import { type FeedQuery, type FeedRow, feedArgs, feedQuery, runFeed, toPost } from "./post.routes";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 5 },
});

const PROMPT = `You help people in Bangladesh give away used things for free.
Look at the photos and write a short listing in Bangla (বাংলা):
- title: what it is, at most 60 characters, no price.
- description: 1–3 plain sentences about what it is and its visible condition.
- category: one of the given ids.
- condition: "new" (unused), "good" (lightly used) or "used" (clearly worn).
- prohibited: true if it is a weapon, medicine, drugs, alcohol, tobacco, a live animal,
  an ID document, or anything illegal to give away; otherwise false.
Never write names, phone numbers, addresses or anything about people visible in the photos.`;

/** One structured-JSON call to Gemini. 429 → ai_limit, anything else unreadable → ai_failed. */
async function askGemini<T>(o: {
  apiKey: string;
  model: string;
  timeoutMs: number;
  parts: object[];
  schema: object;
}): Promise<T> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(o.model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": o.apiKey },
      signal: AbortSignal.timeout(o.timeoutMs),
      body: JSON.stringify({
        contents: [{ parts: o.parts }],
        generationConfig: { responseMimeType: "application/json", responseSchema: o.schema },
      }),
    },
  );
  if (r.status === 429) throw new HttpError(429, "ai_limit", "Gemini rate limit");
  if (!r.ok) throw new HttpError(502, "ai_failed", `Gemini responded ${r.status}`);
  const body = (await r.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  try {
    return JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text ?? "") as T;
  } catch {
    throw new HttpError(502, "ai_failed", "Unreadable AI answer");
  }
}

// POST /api/ai/draft — photos in, a suggested title/description/category/condition out.
router.post(
  "/draft",
  requireAuth,
  userLimit(15, 20),
  upload.array("photos"),
  ah(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw badRequest("photo_required");
    if (!(await flagOn("ai_draft")))
      throw new HttpError(503, "ai_unavailable", "AI drafts are switched off");
    const gemini = await integration("gemini");
    if (!gemini.enabled || !gemini.values.apiKey)
      throw new HttpError(503, "ai_unavailable", "No Gemini key");

    // Per-person daily cap, counted before the call so retries can't get around it.
    const db = getSupabaseClient();
    const { aiDailyLimit } = await getSetting<GeneralSettings>("general");
    const today = new Date().toISOString().slice(0, 10);
    const usage = must(
      await db
        .from("ai_usage")
        .select("count")
        .eq("user_id", me(req).id)
        .eq("day", today)
        .maybeSingle(),
    ) as { count: number } | null;
    if ((usage?.count ?? 0) >= aiDailyLimit)
      throw new HttpError(429, "ai_limit", "Daily AI limit reached");
    must(
      await db
        .from("ai_usage")
        .upsert({ user_id: me(req).id, day: today, count: (usage?.count ?? 0) + 1 }),
    );

    const categories = (
      must(await db.from("categories").select("id").eq("enabled", true)) as { id: string }[]
    ).map((c) => c.id);
    const draft = await askGemini<{
      title: string;
      description: string;
      category: string;
      condition: string;
      prohibited: boolean;
    }>({
      apiKey: gemini.values.apiKey,
      model: gemini.values.model || "gemini-2.5-flash",
      timeoutMs: 25_000,
      parts: [
        { text: `${PROMPT}\nCategory ids: ${categories.join(", ")}` },
        ...files.map((f) => ({
          inline_data: { mime_type: f.mimetype, data: f.buffer.toString("base64") },
        })),
      ],
      schema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          category: { type: "STRING", enum: categories },
          condition: { type: "STRING", enum: ["new", "good", "used"] },
          prohibited: { type: "BOOLEAN" },
        },
        required: ["title", "description", "category", "condition", "prohibited"],
      },
    });
    if (draft.prohibited)
      throw new HttpError(422, "prohibited_item", "This item can't be given on ReuseDo");
    res.json({
      success: true,
      data: {
        title: String(draft.title).slice(0, 150),
        description: String(draft.description).slice(0, 2000),
        category: categories.includes(draft.category) ? draft.category : "other",
        condition: ["new", "good", "used"].includes(draft.condition) ? draft.condition : "good",
      },
    });
  }),
);

export const aiRouter = router;

// ---------------------------------------------------------------------------
// AI search: Gemini reads what the person typed — Bangla, English, Banglish, typos —
// and turns it into the words posts are actually written with. The database search
// stays the same; it just runs for each of those words.
// ---------------------------------------------------------------------------

const SEARCH_PROMPT = `You are the search box of ReuseDo, where people in Bangladesh give away
used things for free ("offer" posts) or ask for things they need ("need" posts).
Read the search text, which may be Bangla, English or Banglish (Bangla in Latin letters),
and may have typos. Return:
- terms: 2–8 short words or phrases a matching post title might contain. Include the item
  in Bangla and in English, common synonyms and the spoken word people use
  (e.g. "পাখা" → "পাখা", "ফ্যান", "fan"; "porar table" → "টেবিল", "পড়ার টেবিল", "table", "desk").
  Singular, lowercase English, no prices, no places, no adjectives like "used" or "free".
- category: the best matching category id, or "all" if unsure.
- kind: "need" only if they are looking for people who need something; "offer" if they
  clearly want to receive an item; otherwise "all".
- level: the study level if they name one (class 1–5 → primary, 6–8 → junior, 9–10 → ssc,
  11–12 → hsc, admission test → admission, university → university), otherwise "all".
- summary: what they are looking for, at most 8 words, in the same language they wrote in.`;

const LEVELS = ["all", "primary", "junior", "ssc", "hsc", "admission", "university"];

interface Understood {
  terms: string[];
  category: string;
  kind: "offer" | "need" | "all";
  level: string;
  summary: string;
}

// The same words are searched again and again ("বই", "table"); Gemini's free tier is
// counted per request, so remember answers for an hour.
const understood = new Map<string, { at: number; v: Understood }>();
const UNDERSTOOD_TTL_MS = 60 * 60 * 1000;

/** What the search text means, or null when AI search is off or Gemini can't answer. */
async function understand(q: string): Promise<Understood | null> {
  const key = q.toLowerCase().replace(/\s+/g, " ");
  const hit = understood.get(key);
  if (hit && Date.now() - hit.at < UNDERSTOOD_TTL_MS) return hit.v;
  if (!(await flagOn("ai_search"))) return null;
  const gemini = await integration("gemini");
  if (!gemini.enabled || !gemini.values.apiKey) return null;

  const cats = must(
    await getSupabaseClient().from("categories").select("id, name_bn, name_en").eq("enabled", true),
  ) as { id: string; name_bn: string; name_en: string }[];
  const ids = ["all", ...cats.map((c) => c.id)];
  let raw: Understood;
  try {
    raw = await askGemini<Understood>({
      apiKey: gemini.values.apiKey,
      model: gemini.values.searchModel || "gemini-2.5-flash-lite",
      // People are waiting on the results; past this, plain search is the better answer.
      timeoutMs: 6_000,
      parts: [
        {
          text: `${SEARCH_PROMPT}\nCategories: ${cats
            .map((c) => `${c.id} (${c.name_bn} / ${c.name_en})`)
            .join(", ")}\nSearch text: ${q}`,
        },
      ],
      schema: {
        type: "OBJECT",
        properties: {
          terms: { type: "ARRAY", items: { type: "STRING" } },
          category: { type: "STRING", enum: ids },
          kind: { type: "STRING", enum: ["offer", "need", "all"] },
          level: { type: "STRING", enum: LEVELS },
          summary: { type: "STRING" },
        },
        required: ["terms", "category", "kind", "level", "summary"],
      },
    });
  } catch {
    return null;
  }

  // What they typed is always searched too, and first.
  const terms = [q, ...(Array.isArray(raw.terms) ? raw.terms : [])]
    .map((t) => String(t).trim().slice(0, 40))
    .filter(
      (t, i, all) =>
        t.length > 0 && all.findIndex((u) => u.toLowerCase() === t.toLowerCase()) === i,
    )
    .slice(0, 8);
  const v: Understood = {
    terms,
    category: ids.includes(raw.category) ? raw.category : "all",
    kind: ["offer", "need"].includes(raw.kind) ? raw.kind : "all",
    level: LEVELS.includes(raw.level) ? raw.level : "all",
    summary: String(raw.summary ?? "").slice(0, 80),
  };
  if (understood.size > 1000) understood.clear();
  understood.set(key, { at: Date.now(), v });
  return v;
}

const searchRouter = Router();

// GET /api/search — the /feed filters plus q; answers { posts, related, ai }.
// Without AI (flag off, no key, Gemini slow or out of quota) it is the plain feed search.
searchRouter.get(
  "/",
  optionalAuth,
  ah(async (req, res) => {
    const f = feedQuery.parse(req.query);
    const q = f.q?.trim();
    if (!q) throw badRequest("q_required");
    const viewer = req.user?.profile.id ?? null;
    const base = { ...f, q, limit: 40, offset: 0 };

    const ai = await understand(q);
    if (!ai) {
      const rows = await runFeed(feedArgs(base, viewer, null));
      return res.json({ success: true, data: { posts: rows.map(toPost), related: [], ai: null } });
    }

    // Filters the person chose win; the AI only fills the ones left at "all".
    const narrowed = {
      ...base,
      kind: f.kind === "all" ? ai.kind : f.kind,
      level: (f.level === "all" ? ai.level : f.level) as FeedQuery["level"],
    };
    const lists = await Promise.all(
      ai.terms.map((t) => runFeed(feedArgs({ ...narrowed, q: t }, viewer, null))),
    );

    // More matching words first; the AI's category breaks ties; then the feed's own order.
    const found = new Map<string, { row: FeedRow; score: number; rank: number }>();
    for (const list of lists) {
      list.forEach((row, rank) => {
        const seen = found.get(row.id);
        if (seen) {
          seen.score += 2;
          seen.rank = Math.min(seen.rank, rank);
        } else {
          found.set(row.id, { row, score: 2 + (row.category_id === ai.category ? 1 : 0), rank });
        }
      });
    }
    const posts = [...found.values()]
      .sort((a, b) => b.score - a.score || a.rank - b.rank)
      .slice(0, 60)
      .map((x) => toPost(x.row));

    // Nothing by name: show what is on offer in the same category instead of a blank page.
    let related: ReturnType<typeof toPost>[] = [];
    if (posts.length === 0 && ai.category !== "all" && f.category === "all") {
      const rows = await runFeed(
        feedArgs({ ...narrowed, q: undefined, category: ai.category, limit: 12 }, viewer, null),
      );
      related = rows.map(toPost);
    }

    res.json({
      success: true,
      data: {
        posts,
        related,
        ai: { terms: ai.terms, category: ai.category, summary: ai.summary },
      },
    });
  }),
);

export { searchRouter };
