import type { NextFunction, Request, Response } from "express";
import { getSupabaseClient } from "../database/client";

export type AdminRole = "super_admin" | "admin" | "moderator";

/**
 * Only these roles may continue. Must run after `requireAuth`. This is the real
 * protection; the admin UI hiding menus (features/admin/permissions.ts) is a convenience.
 * The role is read fresh (not from the profile cache) so revoking it works at once.
 */
export const requireAdmin =
  (allowed: AdminRole[]) => async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, code: "unauthorized", message: "Unauthorized" });
    }
    try {
      const { data } = await getSupabaseClient()
        .from("profiles")
        .select("admin_role, status")
        .eq("id", req.user.profile.id)
        .maybeSingle();
      const role = data?.status === "active" ? (data.admin_role as AdminRole | null) : null;
      if (!role || !allowed.includes(role)) {
        return res
          .status(403)
          .json({ success: false, code: "forbidden", message: "Admin access required" });
      }
      req.user.profile.admin_role = role;
      next();
    } catch (e) {
      next(e);
    }
  };

export const ALL_ADMINS: AdminRole[] = ["super_admin", "admin", "moderator"];
export const ADMINS: AdminRole[] = ["super_admin", "admin"];
export const SUPER: AdminRole[] = ["super_admin"];
