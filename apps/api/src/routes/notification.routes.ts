import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { ah, must } from "../lib/http";
import { me, requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

// GET /api/notifications — latest 50.
router.get(
  "/",
  ah(async (req, res) => {
    const rows = must(
      await getSupabaseClient()
        .from("notifications")
        .select("id, kind, text, href, is_read, created_at")
        .eq("user_id", me(req).id)
        .order("created_at", { ascending: false })
        .limit(50),
    ) as { id: string; kind: string; text: string; href: string; is_read: boolean; created_at: string }[];
    res.json({
      success: true,
      data: rows.map((n) => ({ id: n.id, kind: n.kind, text: n.text, href: n.href, unread: !n.is_read, at: n.created_at })),
    });
  }),
);

// POST /api/notifications/read { id: uuid | "all" }
router.post(
  "/read",
  ah(async (req, res) => {
    const { id } = z.object({ id: z.union([z.literal("all"), z.string().uuid()]) }).parse(req.body);
    let q = getSupabaseClient().from("notifications").update({ is_read: true }).eq("user_id", me(req).id);
    if (id !== "all") q = q.eq("id", id);
    must(await q);
    res.json({ success: true });
  }),
);

export const notificationRouter = router;
