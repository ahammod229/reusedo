import { Router } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/rbac.middleware";

export const analyticsRouter = Router();

// User Dashboard Summary
analyticsRouter.get("/dashboard", requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const summary = await AnalyticsService.getUserDashboardSummary(req.user.uid);
    res.json(summary);
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

// Personal Analytics
analyticsRouter.get("/personal", requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const analytics = await AnalyticsService.getPersonalAnalytics(req.user.uid);
    res.json(analytics);
  } catch (error) {
    console.error("Personal Analytics Error:", error);
    res.status(500).json({ error: "Failed to fetch personal analytics" });
  }
});

// Admin KPI Dashboard
analyticsRouter.get("/admin/kpi", requireAuth, requireAdmin(["super_admin", "moderator"]), async (req, res) => {
  try {
    const kpi = await AnalyticsService.getAdminKpiSummary();
    res.json(kpi);
  } catch (error) {
    console.error("Admin KPI Error:", error);
    res.status(500).json({ error: "Failed to fetch admin KPIs" });
  }
});
