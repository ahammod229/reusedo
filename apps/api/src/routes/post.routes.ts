import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { ah, badRequest, forbidden, must, notFound } from "../lib/http";
import { notify } from "../lib/notify";
import { type GeneralSettings, flagOn, getSetting } from "../lib/settings";
import { uploadImage } from "../lib/storage";
import { me, optionalAuth, requireAuth } from "../middlewares/auth.middleware";

const router = Router();

const LEVELS = ["primary", "junior", "ssc", "hsc", "admission", "university"] as const;
const CONDITIONS = ["new", "good", "used"] as const;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 10 },
});

/** Row returned by the public.feed() SQL function. */
export interface FeedRow {
  id: string;
  kind: "offer" | "need";
  title: string;
  description: string;
  category_id: string;
  condition: string;
  area: string;
  district: string;
  distance_km: number | null;
  images: string[];
  created_at: string;
  request_count: number;
  edu_level: string | null;
  edu_detail: string | null;
  delivery: string[];
  urgency: string | null;
  qty: number | null;
  status: "available" | "reserved" | "given";
  owner_id: string;
  author_name: string;
  author_username: string;
  author_verified: boolean;
  author_trust: number;
}

export const toPost = (r: FeedRow) => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  description: r.description,
  category: r.category_id,
  condition: r.condition,
  area: r.area,
  district: r.district,
  distanceKm: r.distance_km === null ? null : Math.round(r.distance_km * 10) / 10,
  author: {
    name: r.author_name,
    username: r.author_username,
    verified: r.author_verified,
    trust: r.author_trust,
  },
  images: r.images,
  createdAt: r.created_at,
  requests: r.request_count,
  edu: r.edu_level ? { level: r.edu_level, detail: r.edu_detail ?? undefined } : undefined,
  delivery: r.delivery,
  urgency: r.urgency ?? undefined,
  qty: r.qty ?? undefined,
  status: r.status,
});

const bool = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((v) => v === true || v === "true" || v === "1")
  .optional();

export const feedQuery = z.object({
  kind: z.enum(["all", "offer", "need"]).default("all"),
  category: z.string().max(40).default("all"),
  scope: z.enum(["area", "district", "country"]).default("country"),
  q: z.string().trim().max(100).optional(),
  level: z.enum(["all", ...LEVELS]).default("all"),
  conditions: z
    .string()
    .optional()
    .transform((s) =>
      s ? s.split(",").filter((c) => (CONDITIONS as readonly string[]).includes(c)) : null,
    ),
  delivery: z.enum(["any", "pickup", "courier"]).default("any"),
  within: z.enum(["24h", "7d", "any"]).default("any"),
  verifiedOnly: bool,
  photoOnly: bool,
  urgentOnly: bool,
  showGiven: bool,
  sort: z.enum(["near", "new", "urgent", "popular"]).default("near"),
  /** One person's public posts (their profile page). */
  user: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(60),
  offset: z.coerce.number().int().min(0).default(0),
});

export type FeedQuery = z.infer<typeof feedQuery>;

export async function runFeed(params: Record<string, unknown>): Promise<FeedRow[]> {
  return must(await getSupabaseClient().rpc("feed", params)) as FeedRow[];
}

/** The feed() arguments for a parsed /feed query. */
export const feedArgs = (f: FeedQuery, viewer: string | null, owner: string | null) => ({
  p_owner: owner,
  p_viewer: viewer,
  p_kind: f.kind,
  p_category: f.category,
  p_scope: f.scope,
  p_q: f.q ?? null,
  p_level: f.level,
  p_conditions: f.conditions,
  p_delivery: f.delivery,
  p_within_hours: f.within === "24h" ? 24 : f.within === "7d" ? 168 : null,
  p_verified_only: f.verifiedOnly ?? false,
  p_photo_only: f.photoOnly ?? false,
  p_urgent_only: f.urgentOnly ?? false,
  p_show_given: f.showGiven ?? false,
  p_sort: f.sort,
  p_limit: f.limit,
  p_offset: f.offset,
});

// GET /api/feed — every filter of the web feed, applied in SQL.
router.get(
  "/feed",
  optionalAuth,
  ah(async (req, res) => {
    const f = feedQuery.parse(req.query);
    let owner: string | null = null;
    if (f.user) {
      const { data } = await getSupabaseClient()
        .from("profiles")
        .select("id")
        .eq("username", f.user.toLowerCase())
        .maybeSingle();
      if (!data) return res.json({ success: true, data: [] });
      owner = data.id;
    }
    const rows = await runFeed(feedArgs(f, req.user?.profile.id ?? null, owner));
    res.json({ success: true, data: rows.map(toPost) });
  }),
);

// GET /api/posts/mine — my live and given posts, newest first.
router.get(
  "/posts/mine",
  requireAuth,
  ah(async (req, res) => {
    const rows = await runFeed({
      p_viewer: me(req).id,
      p_owner: me(req).id,
      p_show_given: true,
      p_sort: "new",
      p_limit: 200,
    });
    res.json({ success: true, data: rows.map(toPost) });
  }),
);

const uuid = z.string().uuid();

// GET /api/posts/:id — 404 for anything moderated or deleted.
router.get(
  "/posts/:id",
  optionalAuth,
  ah(async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) throw notFound("post_not_found");
    const [row] = await runFeed({
      p_viewer: req.user?.profile.id ?? null,
      p_ids: [id.data],
      p_show_given: true,
      p_limit: 1,
    });
    if (!row) throw notFound("post_not_found");
    // Count real visits only, not the owner looking at their own post.
    if (row.owner_id !== req.user?.profile.id) {
      void getSupabaseClient()
        .rpc("bump_view", { p_post: row.id })
        .then(() => undefined);
    }
    // My open request on this post, so the page shows "Request sent" and links the chat.
    let myRequest: { exchangeId: string; conversationId: string | null; status: string } | null =
      null;
    if (req.user && row.owner_id !== req.user.profile.id) {
      const { data } = await getSupabaseClient()
        .from("exchanges")
        .select("id, conversation_id, status")
        .eq("post_id", row.id)
        .eq("requested_by", req.user.profile.id)
        .neq("status", "cancelled")
        .maybeSingle();
      if (data) {
        myRequest = {
          exchangeId: data.id,
          conversationId: data.conversation_id,
          status: data.status,
        };
      }
    }
    res.json({
      success: true,
      data: { ...toPost(row), mine: row.owner_id === req.user?.profile.id, myRequest },
    });
  }),
);

const newPost = z
  .object({
    kind: z.enum(["offer", "need"]),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(2000).default(""),
    category: z.string().max(40),
    condition: z.enum(CONDITIONS).default("good"),
    edu: z
      .object({ level: z.enum(LEVELS), detail: z.string().trim().max(120).optional() })
      .optional(),
    delivery: z
      .array(z.enum(["pickup", "courier"]))
      .min(1)
      .max(2),
    urgency: z.enum(["urgent", "soon", "anytime"]).optional(),
    qty: z.number().int().min(1).max(999).optional(),
  })
  .strict();

// POST /api/posts — multipart: "data" (JSON) + up to maxPhotos "photos".
router.post(
  "/posts",
  requireAuth,
  upload.array("photos"),
  ah(async (req, res) => {
    const profile = me(req);
    let raw: unknown;
    try {
      raw = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
    } catch {
      throw badRequest("invalid_json");
    }
    const input = newPost.parse(raw);
    if (input.kind === "need" && !(await flagOn("need_posts")))
      throw forbidden("need_posts_disabled");
    // Posts show the owner's area; without one the feed can't place them.
    if (!profile.district) throw badRequest("profile_incomplete", "Add your area before posting");

    const db = getSupabaseClient();
    const cat = must(
      await db
        .from("categories")
        .select("id")
        .eq("id", input.category)
        .eq("enabled", true)
        .maybeSingle(),
    );
    if (!cat) throw badRequest("invalid_category");

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const { maxPhotos } = await getSetting<GeneralSettings>("general");
    if (files.length > maxPhotos)
      throw badRequest("too_many_photos", `At most ${maxPhotos} photos`);
    if (input.kind === "offer" && files.length === 0) throw badRequest("photo_required");

    const images = await Promise.all(
      files.map((f) => uploadImage("post-images", profile.id, f, MAX_IMAGE_BYTES)),
    );

    const row = must(
      await db
        .from("posts")
        .insert({
          owner_id: profile.id,
          kind: input.kind,
          title: input.title,
          description: input.description,
          category_id: input.category,
          condition: input.condition,
          district: profile.district,
          area: profile.area ?? profile.upazila ?? "",
          area_lat: profile.area_lat,
          area_lng: profile.area_lng,
          images,
          edu_level: input.edu?.level ?? null,
          edu_detail: input.edu?.detail ?? null,
          delivery: input.delivery,
          urgency: input.kind === "need" ? (input.urgency ?? "anytime") : null,
          qty: input.qty ?? null,
        })
        .select("id")
        .single(),
    ) as { id: string };

    const [created] = await runFeed({ p_viewer: profile.id, p_ids: [row.id], p_show_given: true });
    res.status(201).json({ success: true, data: toPost(created) });
  }),
);

const ownerUpdate = z
  .object({
    status: z.enum(["available", "given", "deleted"]).optional(),
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

// PATCH /api/posts/:id — owner only: edit text, mark given, or delete.
router.patch(
  "/posts/:id",
  requireAuth,
  ah(async (req, res) => {
    const id = uuid.parse(req.params.id);
    const changes = ownerUpdate.parse(req.body);
    const db = getSupabaseClient();
    const post = must(
      await db.from("posts").select("id, owner_id, status").eq("id", id).maybeSingle(),
    ) as { id: string; owner_id: string; status: string } | null;
    if (!post || post.status === "deleted") throw notFound("post_not_found");
    if (post.owner_id !== me(req).id) throw forbidden();
    // Moderators hid it; the owner can't bring it back on their own.
    if (post.status === "hidden") throw forbidden("post_hidden");

    must(
      await db
        .from("posts")
        .update({
          ...changes,
          ...(changes.status === "given" ? { given_at: new Date().toISOString() } : {}),
        })
        .eq("id", id),
    );
    res.json({ success: true });
  }),
);

const requestBody = z.object({
  message: z.string().trim().max(500).default(""),
  via: z.enum(["pickup", "courier"]),
});

// POST /api/posts/:id/requests — "I want this" (offer) / "I have this" (need).
// Creates the exchange, a chat with a system line and the message, and notifies the owner.
router.post(
  "/posts/:id/requests",
  requireAuth,
  ah(async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) throw notFound("post_not_found");
    const { message, via } = requestBody.parse(req.body);
    const db = getSupabaseClient();
    const ex = must(
      await db.rpc("request_post", {
        p_post: id.data,
        p_requester: me(req).id,
        p_message: message,
        p_via: via,
      }),
    ) as { id: string; conversation_id: string };
    const post = must(
      await db.from("posts").select("owner_id, title, kind").eq("id", id.data).single(),
    ) as { owner_id: string; title: string; kind: string };
    await notify(
      post.owner_id,
      "request",
      post.kind === "offer"
        ? `${me(req).display_name} আপনার ‘${post.title}’ চেয়েছেন`
        : `${me(req).display_name} আপনার দরকারি ‘${post.title}’ দিতে চান`,
      "/exchanges",
    );
    res
      .status(201)
      .json({ success: true, data: { exchangeId: ex.id, conversationId: ex.conversation_id } });
  }),
);

export const postRouter = router;
