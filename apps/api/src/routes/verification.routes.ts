import { createVerificationSchema } from "../shared/validation";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { TrustService } from "../services/trust.service";

const router = Router();
const trustService = new TrustService();

// Submit verification document
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const data = createVerificationSchema.parse(req.body);

    const verification = await trustService.submitVerification(userId, data);
    res.status(201).json(verification);
  } catch (error) {
    next(error);
  }
});

// Get own verification status
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const verification = await trustService.getVerificationStatus(userId);
    if (!verification) {
      return res.status(404).json({ message: "Verification not found" });
    }
    res.json(verification);
  } catch (error) {
    next(error);
  }
});

// Admin: Update verification status
// In a real scenario, this would have a requireAdmin middleware
router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Minimal validation inline
    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const updated = await trustService.updateVerificationStatus(
      id,
      status as "approved" | "rejected",
      adminNotes,
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export const verificationRoutes = router;
