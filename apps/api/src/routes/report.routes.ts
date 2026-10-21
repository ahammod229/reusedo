import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { ah, must } from "../lib/http";
import { me, requireAuth } from "../middlewares/auth.middleware";

const router = Router();

const reportBody = z.object({
  targetType: z.enum(["post", "user", "message", "review"]),
  targetId: z.string().uuid(),
  reason: z.enum(["spam", "fraud", "abuse", "fake_item", "inappropriate", "sold", "other"]),
  details: z.string().trim().max(1000).default(""),
});

// POST /api/reports — reporting the same thing twice while it's open is a no-op.
router.post(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const r = reportBody.parse(req.body);
    const { error } = await getSupabaseClient()
      .from("reports")
      .insert({
        reporter_id: me(req).id,
        target_type: r.targetType,
        target_id: r.targetId,
        reason: r.reason,
        details: r.details,
      });
    if (error && (error as { code?: string }).code !== "23505") must({ data: null, error });
    res.status(201).json({ success: true });
  }),
);

export const reportRouter = router;
