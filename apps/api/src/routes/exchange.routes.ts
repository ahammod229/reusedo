import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { HttpError, ah, badRequest, forbidden, must, notFound } from "../lib/http";
import { notify } from "../lib/notify";
import { me, requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

const MAX_HANDOVER_TRIES = 5;

export interface ExchangeRow {
  id: string;
  post_id: string;
  giver_id: string;
  receiver_id: string;
  requested_by: string;
  status: "requested" | "accepted" | "scheduled" | "completed" | "cancelled";
  via: "pickup" | "courier";
  conversation_id: string | null;
  handover_code_hash: string | null;
  handover_attempts: number;
  updated_at: string;
  post: { title: string; category_id: string; kind: string; qty: number | null; status: string };
  giver: { display_name: string; username: string };
  receiver: { display_name: string; username: string };
  reviews: { reviewer_id: string }[];
}

export const EXCHANGE_SELECT = `id, post_id, giver_id, receiver_id, requested_by, status, via, conversation_id,
  handover_code_hash, handover_attempts, updated_at,
  post:posts!exchanges_post_id_fkey (title, category_id, kind, qty, status),
  giver:profiles!exchanges_giver_id_fkey (display_name, username),
  receiver:profiles!exchanges_receiver_id_fkey (display_name, username),
  reviews (reviewer_id)`;

export function toExchange(e: ExchangeRow, myId: string) {
  const giver = e.giver_id === myId;
  const other = giver ? e.receiver : e.giver;
  return {
    id: e.id,
    postId: e.post_id,
    title: e.post.title,
    category: e.post.category_id,
    role: giver ? "giver" : "receiver",
    other: other.display_name,
    otherUsername: other.username,
    status: e.status,
    via: e.via,
    updatedAt: e.updated_at,
    conversationId: e.conversation_id,
    // The side that didn't send the request decides on it.
    canAccept: e.status === "requested" && e.requested_by !== myId,
    // Receiver writes a thank-you note; giver writes a review. Either way, once.
    thanked: e.reviews.some((r) => r.reviewer_id === myId),
  };
}

const uuid = z.string().uuid();

export async function loadExchange(id: string, myId: string): Promise<ExchangeRow> {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw notFound("exchange_not_found");
  const row = must(
    await getSupabaseClient()
      .from("exchanges")
      .select(EXCHANGE_SELECT)
      .eq("id", parsed.data)
      .maybeSingle(),
  ) as unknown as ExchangeRow | null;
  // Not yours looks the same as not existing.
  if (!row || (row.giver_id !== myId && row.receiver_id !== myId))
    throw notFound("exchange_not_found");
  return row;
}

async function setStatus(e: ExchangeRow, status: ExchangeRow["status"], extra: object = {}) {
  const changed = must(
    await getSupabaseClient()
      .from("exchanges")
      .update({ status, ...extra })
      .eq("id", e.id)
      .eq("status", e.status) // Lost a race with the other side: nothing changes.
      .select("id"),
  ) as { id: string }[];
  if (changed.length === 0) throw new HttpError(409, "changed_meanwhile", "Reload and try again");
}

/** Completing hands the item over: the post becomes "given" and both trust scores update. */
async function complete(e: ExchangeRow) {
  const db = getSupabaseClient();
  await setStatus(e, "completed", {
    completed_at: new Date().toISOString(),
    handover_code_hash: null,
  });
  // A post with several items (qty > 1) stays open for the next person.
  if (!e.post.qty || e.post.qty <= 1) {
    must(
      await db
        .from("posts")
        .update({ status: "given", given_at: new Date().toISOString() })
        .eq("id", e.post_id),
    );
  }
  await Promise.all([
    db.rpc("refresh_trust", { p_user: e.giver_id }),
    db.rpc("refresh_trust", { p_user: e.receiver_id }),
  ]);
  await notify(e.giver_id, "accepted", `‘${e.post.title}’ হস্তান্তর সম্পন্ন হয়েছে`, "/exchanges");
  await notify(
    e.receiver_id,
    "accepted",
    `‘${e.post.title}’ পেয়েছেন — ধন্যবাদ জানাতে পারেন`,
    "/exchanges",
  );
}

const reply = async (res: import("express").Response, id: string, myId: string) =>
  res.json({ success: true, data: toExchange(await loadExchange(id, myId), myId) });

// GET /api/exchanges — everything I give or receive, latest activity first.
router.get(
  "/",
  ah(async (req, res) => {
    const myId = me(req).id;
    const rows = must(
      await getSupabaseClient()
        .from("exchanges")
        .select(EXCHANGE_SELECT)
        .or(`giver_id.eq.${myId},receiver_id.eq.${myId}`)
        .order("updated_at", { ascending: false })
        .limit(200),
    ) as unknown as ExchangeRow[];
    res.json({ success: true, data: rows.map((r) => toExchange(r, myId)) });
  }),
);

// POST /api/exchanges/:id/advance — requested → accepted → scheduled. Completion goes
// through the handover code (pickup) or the receiver confirming arrival (courier).
router.post(
  "/:id/advance",
  ah(async (req, res) => {
    const myId = me(req).id;
    const e = await loadExchange(req.params.id, myId);
    const db = getSupabaseClient();

    if (e.status === "requested") {
      if (e.requested_by === myId) throw forbidden("not_your_decision");
      await setStatus(e, "accepted");
      must(
        await db
          .from("posts")
          .update({ status: "reserved" })
          .eq("id", e.post_id)
          .eq("status", "available"),
      );
      await notify(
        e.requested_by,
        "accepted",
        `আপনার রিকোয়েস্ট গ্রহণ হয়েছে: ‘${e.post.title}’`,
        "/exchanges",
      );
    } else if (e.status === "accepted") {
      await setStatus(e, "scheduled");
    } else if (e.status === "scheduled" && e.via === "courier") {
      if (e.receiver_id !== myId) throw forbidden("receiver_confirms");
      await complete(e);
    } else if (e.status === "scheduled") {
      throw badRequest("use_handover_code", "Pickups are completed with the handover code");
    } else {
      throw badRequest("already_closed");
    }
    await reply(res, e.id, myId);
  }),
);

// POST /api/exchanges/:id/cancel — either side, until it's done.
router.post(
  "/:id/cancel",
  ah(async (req, res) => {
    const myId = me(req).id;
    const e = await loadExchange(req.params.id, myId);
    if (e.status === "completed" || e.status === "cancelled") throw badRequest("already_closed");
    await setStatus(e, "cancelled", { handover_code_hash: null });
    await releasePost(e.post_id);
    const other = e.giver_id === myId ? e.receiver_id : e.giver_id;
    await notify(other, "request", `‘${e.post.title}’ — লেনদেন বাতিল হয়েছে`, "/exchanges");
    await reply(res, e.id, myId);
  }),
);

/** Frees a reserved post again unless another request on it is still going ahead. */
export async function releasePost(postId: string) {
  const db = getSupabaseClient();
  const { count } = await db
    .from("exchanges")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .in("status", ["accepted", "scheduled"]);
  if (!count) {
    must(
      await db
        .from("posts")
        .update({ status: "available" })
        .eq("id", postId)
        .eq("status", "reserved"),
    );
  }
}

const hashCode = (exchangeId: string, code: string) =>
  createHash("sha256")
    .update(`${exchangeId}:${code}:${process.env.EMAIL_CODE_PEPPER ?? ""}`)
    .digest("hex");

// GET /api/exchanges/:id/handover-code — giver only. A new code each time; only its hash is kept.
router.get(
  "/:id/handover-code",
  ah(async (req, res) => {
    const myId = me(req).id;
    const e = await loadExchange(req.params.id, myId);
    if (e.giver_id !== myId) throw forbidden("giver_only");
    if (e.via !== "pickup" || !["accepted", "scheduled"].includes(e.status)) {
      throw badRequest("no_handover_now");
    }
    if (e.handover_attempts >= MAX_HANDOVER_TRIES) throw new HttpError(429, "handover_locked");
    const code = String(randomInt(1000, 10000));
    must(
      await getSupabaseClient()
        .from("exchanges")
        .update({ handover_code_hash: hashCode(e.id, code) })
        .eq("id", e.id),
    );
    res.set("Cache-Control", "no-store").json({ success: true, data: { code } });
  }),
);

// POST /api/exchanges/:id/handover { code } — receiver only; 5 wrong tries lock it.
router.post(
  "/:id/handover",
  ah(async (req, res) => {
    const myId = me(req).id;
    const { code } = z.object({ code: z.string().regex(/^\d{4}$/) }).parse(req.body);
    const e = await loadExchange(req.params.id, myId);
    if (e.receiver_id !== myId) throw forbidden("receiver_only");
    if (!["accepted", "scheduled"].includes(e.status)) throw badRequest("no_handover_now");
    if (e.handover_attempts >= MAX_HANDOVER_TRIES) throw new HttpError(429, "handover_locked");
    if (!e.handover_code_hash) throw badRequest("no_code_yet", "Ask the giver to open their code");

    const given = Buffer.from(hashCode(e.id, code), "hex");
    const stored = Buffer.from(e.handover_code_hash, "hex");
    if (given.length !== stored.length || !timingSafeEqual(given, stored)) {
      must(
        await getSupabaseClient()
          .from("exchanges")
          .update({ handover_attempts: e.handover_attempts + 1 })
          .eq("id", e.id),
      );
      throw badRequest("wrong_code");
    }
    await complete(e);
    await reply(res, e.id, myId);
  }),
);

const thanksBody = z.object({
  text: z.string().trim().min(3).max(280),
  stars: z.number().int().min(1).max(5).default(5),
});

// POST /api/exchanges/:id/thanks — receiver: thank-you note (on the giver's profile)
// plus a rating; giver: a rating of the receiver. Once per person per exchange.
router.post(
  "/:id/thanks",
  ah(async (req, res) => {
    const myId = me(req).id;
    const { text, stars } = thanksBody.parse(req.body);
    const e = await loadExchange(req.params.id, myId);
    if (e.status !== "completed") throw badRequest("not_completed");
    const receiver = e.receiver_id === myId;
    const other = receiver ? e.giver_id : e.receiver_id;
    const db = getSupabaseClient();

    must(
      await db.from("reviews").insert({
        exchange_id: e.id,
        reviewer_id: myId,
        reviewee_id: other,
        rating: stars,
        comment: text,
      }),
    );
    if (receiver) {
      must(
        await db.from("thanks").insert({ exchange_id: e.id, from_id: myId, to_id: other, text }),
      );
    }
    await db.rpc("refresh_trust", { p_user: other });
    const name = me(req).display_name;
    await notify(
      other,
      "review",
      receiver ? `${name} আপনাকে ধন্যবাদ জানিয়েছেন` : `${name} আপনাকে রিভিউ দিয়েছেন`,
      "/profile",
    );
    res.status(201).json({ success: true });
  }),
);

export const exchangeRouter = router;
