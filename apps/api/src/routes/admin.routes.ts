import { Router } from "express";
import { AdminService } from "../services/admin.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/rbac.middleware";
import {
  assignRoleSchema,
  updateCmsPageSchema,
  cmsPageSchema,
  platformSettingsSchema,
  featureFlagSchema,
  updateFeatureFlagSchema
} from "@reusedo/validation";

export const adminRouter = Router();

// Require all admin routes to be authenticated and at least have 'admin' or 'super_admin' roles.
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin(["super_admin", "admin", "moderator", "support_agent", "content_manager"]));

// 1. Dashboard Analytics
adminRouter.get("/dashboard/metrics", async (req, res) => {
  try {
    const metrics = await AdminService.getDashboardMetrics();
    res.json(metrics);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 2. Users Management
adminRouter.get("/users", requireAdmin(["super_admin", "admin", "moderator", "support_agent"]), async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    
    const result = await AdminService.getUsers(page, limit, search);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

adminRouter.patch("/users/:id/role", requireAdmin(["super_admin"]), async (req, res) => {
  try {
    const { role } = assignRoleSchema.parse(req.body);
    const updated = await AdminService.updateUserRole((req.adminProfile as { id: string })?.id, req.params.id, role);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// 3. CMS Pages
adminRouter.get("/cms", async (req, res) => {
  try {
    const pages = await AdminService.getCMSPages();
    res.json(pages);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

adminRouter.post("/cms", requireAdmin(["super_admin", "admin", "content_manager"]), async (req, res) => {
  try {
    const data = cmsPageSchema.parse(req.body);
    const created = await AdminService.createCMSPage((req.adminProfile as { id: string })?.id, data);
    res.status(201).json(created);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

adminRouter.patch("/cms/:slug", requireAdmin(["super_admin", "admin", "content_manager"]), async (req, res) => {
  try {
    const data = updateCmsPageSchema.parse(req.body);
    const updated = await AdminService.updateCMSPage((req.adminProfile as { id: string })?.id, req.params.slug, data);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// 4. Platform Settings
adminRouter.get("/settings", requireAdmin(["super_admin", "admin"]), async (req, res) => {
  try {
    const settings = await AdminService.getPlatformSettings();
    res.json(settings);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

adminRouter.patch("/settings", requireAdmin(["super_admin"]), async (req, res) => {
  try {
    const data = platformSettingsSchema.parse(req.body);
    const updated = await AdminService.updatePlatformSetting((req.adminProfile as { id: string })?.id, data.key, data.value);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// 5. Feature Flags
adminRouter.get("/feature-flags", requireAdmin(["super_admin", "admin"]), async (req, res) => {
  try {
    const flags = await AdminService.getFeatureFlags();
    res.json(flags);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

adminRouter.patch("/feature-flags/:key", requireAdmin(["super_admin"]), async (req, res) => {
  try {
    const data = updateFeatureFlagSchema.parse(req.body);
    const updated = await AdminService.updateFeatureFlag((req.adminProfile as { id: string })?.id, req.params.key, data);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// 6. Audit Logs
adminRouter.get("/audit-logs", requireAdmin(["super_admin", "admin"]), async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 50;
    const logs = await AdminService.getAuditLogs(page, limit);
    res.json(logs);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// (Stubs for products, needs, exchanges, shipping, reviews, reports, categories are implied for full M12 implementation)
// For example:
// adminRouter.use("/products", adminProductRouter);
