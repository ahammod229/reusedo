import { createReviewSchema } from "../shared/validation";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { TrustService } from "../services/trust.service";

const router = Router();
const trustService = new TrustService();

// Create a review
router.post("/:revieweeId", requireAuth, async (req, res, next) => {
  try {
    const reviewerId = req.user?.profile?.id as string;
    const revieweeId = req.params.revieweeId;
    const data = createReviewSchema.parse(req.body);

    const review = await trustService.submitReview(reviewerId, revieweeId, data);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

// Get reviews for a user
router.get("/:userId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const reviews = await trustService.getReviewsForUser(userId);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

export const reviewRoutes = router;
