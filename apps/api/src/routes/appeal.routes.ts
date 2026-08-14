import { createAppealSchema } from "../shared/validation";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { TrustService } from "../services/trust.service";

const router = Router();
const trustService = new TrustService();

// Submit an appeal
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const data = createAppealSchema.parse(req.body);

    const appeal = await trustService.submitAppeal(userId, data);
    res.status(201).json(appeal);
  } catch (error) {
    next(error);
  }
});

export const appealRoutes = router;
