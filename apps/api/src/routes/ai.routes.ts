import { Router } from "express";
import multer from "multer";
import { getSupabaseClient } from "../database/client";
import { HttpError, ah, badRequest, must } from "../lib/http";
import { integration } from "../lib/integrations";
import { userLimit } from "../lib/limits";
import { type GeneralSettings, flagOn, getSetting } from "../lib/settings";
import { me, requireAuth } from "../middlewares/auth.middleware";

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
    const model = gemini.values.model || "gemini-2.5-flash";
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": gemini.values.apiKey },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${PROMPT}\nCategory ids: ${categories.join(", ")}` },
                ...files.map((f) => ({
                  inline_data: { mime_type: f.mimetype, data: f.buffer.toString("base64") },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
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
          },
        }),
      },
    );
    if (r.status === 429) throw new HttpError(429, "ai_limit", "Gemini rate limit");
    if (!r.ok) throw new HttpError(502, "ai_failed", `Gemini responded ${r.status}`);

    const body = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    let draft: {
      title: string;
      description: string;
      category: string;
      condition: string;
      prohibited: boolean;
    };
    try {
      draft = JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    } catch {
      throw new HttpError(502, "ai_failed", "Unreadable AI answer");
    }
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
