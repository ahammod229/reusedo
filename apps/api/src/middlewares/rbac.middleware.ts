import type { NextFunction, Request, Response } from "express";

export type AdminRole = "super_admin" | "admin" | "moderator";

/**
 * Only these roles may continue. Must run after `requireAuth`. This is the real
 * protection; the admin UI hiding menus (features/admin/permissions.ts) is a convenience.
 */
export const requireAdmin =
  (allowed: AdminRole[]) => (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.profile.admin_role;
    if (!req.user) return res.status(401).json({ success: false, code: "unauthorized", message: "Unauthorized" });
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ success: false, code: "forbidden", message: "Admin access required" });
    }
    next();
  };

export const ALL_ADMINS: AdminRole[] = ["super_admin", "admin", "moderator"];
export const ADMINS: AdminRole[] = ["super_admin", "admin"];
export const SUPER: AdminRole[] = ["super_admin"];
