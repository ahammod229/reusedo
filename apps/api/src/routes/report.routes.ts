import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { TrustService } from "../services/trust.service";
import { createReportSchema } from "@reusedo/validation";

const router = Router();
const trustService = new TrustService();

// Submit a report
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const reporterId = req.user?.uid as string;
    const data = createReportSchema.parse(req.body);

    const report = await trustService.submitReport(reporterId, data);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

// Admin: Get all reports
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const reports = await trustService.getReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

export const reportRoutes = router;
