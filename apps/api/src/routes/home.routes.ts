import { Router } from "express";
import { getSupabaseClient } from "../database/client";
import { ah, must, notFound } from "../lib/http";
import { me, requireAuth } from "../middlewares/auth.middleware";
import { runFeed, toPost } from "./post.routes";

const router = Router();

// GET /api/categories — enabled categories in display order.
router.get(
  "/categories",
  ah(async (_req, res) => {
    const rows = must(
      await getSupabaseClient()
        .from("categories")
        .select("id, name_bn, name_en, emoji")
        .eq("enabled", true)
        .order("sort"),
    ) as { id: string; name_bn: string; name_en: string; emoji: string }[];
    res.set("Cache-Control", "public, max-age=300");
    res.json({
      success: true,
      data: rows.map((c) => ({ id: c.id, bn: c.name_bn, en: c.name_en, emoji: c.emoji })),
    });
  }),
);

// GET /api/pages/:slug — published CMS pages (terms, privacy, about, help).
router.get(
  "/pages/:slug",
  ah(async (req, res) => {
    const page = must(
      await getSupabaseClient()
        .from("cms_pages")
        .select("slug, title, body, updated_at")
        .eq("slug", req.params.slug)
        .eq("status", "published")
        .maybeSingle(),
    ) as { slug: string; title: string; body: string; updated_at: string } | null;
    if (!page) throw notFound("page_not_found");
    res.set("Cache-Control", "public, max-age=300");
    res.json({
      success: true,
      data: { slug: page.slug, title: page.title, body: page.body, updatedAt: page.updated_at },
    });
  }),
);

// GET /api/stats/donation-map — per district, never an address.
router.get(
  "/stats/donation-map",
  ah(async (_req, res) => {
    const data = must(await getSupabaseClient().rpc("donation_map"));
    res.set("Cache-Control", "public, max-age=300");
    res.json({ success: true, data });
  }),
);

// GET /api/me/dashboard — what's waiting for me, and what fits me nearby.
router.get(
  "/me/dashboard",
  requireAuth,
  ah(async (req, res) => {
    const p = me(req);
    const db = getSupabaseClient();
    const mine = `giver_id.eq.${p.id},receiver_id.eq.${p.id}`;

    const [toAnswer, active, unread, done, offers, needs, thanks, nearby] = await Promise.all([
      db
        .from("exchanges")
        .select("id", { count: "exact", head: true })
        .or(mine)
        .eq("status", "requested")
        .neq("requested_by", p.id),
      db
        .from("exchanges")
        .select("id", { count: "exact", head: true })
        .or(mine)
        .in("status", ["accepted", "scheduled"]),
      db.from("conversation_participants").select("unread_count").eq("user_id", p.id),
      db
        .from("exchanges")
        .select(
          "id, post:posts!exchanges_post_id_fkey (title), giver:profiles!exchanges_giver_id_fkey (display_name), reviews (reviewer_id)",
        )
        .eq("receiver_id", p.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(20),
      runFeed({ p_viewer: p.id, p_kind: "offer", p_sort: "near", p_limit: 80 }),
      runFeed({ p_viewer: p.id, p_kind: "need", p_scope: "area", p_sort: "urgent", p_limit: 12 }),
      db
        .from("thanks")
        .select(
          "text, created_at, from:profiles!thanks_from_id_fkey (display_name), exchange:exchanges (post:posts (title))",
        )
        .eq("to_id", p.id)
        .order("created_at", { ascending: false })
        .limit(2),
      p.district
        ? db
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("district", p.district)
            .gt("last_active_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
        : Promise.resolve({ count: 0 }),
    ]);

    type Done = {
      id: string;
      post: { title: string };
      giver: { display_name: string };
      reviews: { reviewer_id: string }[];
    };
    type Thanks = {
      text: string;
      created_at: string;
      from: { display_name: string };
      exchange: { post: { title: string } };
    };
    const fits = (r: { edu_level: string | null; category_id: string }) =>
      (p.level && r.edu_level === p.level) || p.interests.includes(r.category_id);

    res.json({
      success: true,
      data: {
        todo: {
          requestsToAnswer: toAnswer.count ?? 0,
          unreadMessages: (must(unread) as { unread_count: number }[]).reduce(
            (n, r) => n + r.unread_count,
            0,
          ),
          activeExchanges: active.count ?? 0,
          thanksToWrite: (must(done) as unknown as Done[])
            .filter((e) => !e.reviews.some((r) => r.reviewer_id === p.id))
            .map((e) => ({ exchangeId: e.id, item: e.post.title, to: e.giver.display_name })),
        },
        forYou: offers
          .filter((r) => r.owner_id !== p.id && r.status === "available" && fits(r))
          .slice(0, 6)
          .map(toPost),
        needsNearby: needs
          .filter((r) => r.owner_id !== p.id && r.status === "available")
          .slice(0, 4)
          .map(toPost),
        recentThanks: (must(thanks) as unknown as Thanks[]).map((t) => ({
          by: t.from.display_name,
          item: t.exchange.post.title,
          text: t.text,
          at: t.created_at,
        })),
        // Shared goals need real counts from a drive table; none exists yet, so none is shown.
        community: null,
        activeNearby: nearby.count ?? 0,
      },
    });
  }),
);

export const homeRouter = router;
