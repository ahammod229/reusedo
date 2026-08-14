import { AdminRepository } from "../database";
import { UserRepository } from "../database";
import type { AdminRole } from "../shared/validation";
import type { NextFunction, Request, Response } from "express";

/**
 * Middleware to ensure the authenticated user has one of the required admin roles.
 * Note: requires `requireAuth` to be called first so `req.user` is populated.
 */
export const requireAdmin = (allowedRoles: AdminRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.uid) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // (Using service role internally)
      const profile = await UserRepository.getProfileByUid(user.uid);
      const isLegacyAdmin = (profile as { role?: string })?.role === "ADMIN";
      const adminRole = (profile as { admin_role?: string }).admin_role || (isLegacyAdmin ? "super_admin" : null);

      if (!profile || !adminRole) {
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }

      // Check if role is allowed
      if (!allowedRoles.includes(adminRole as AdminRole)) {
        res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        return;
      }

      // Populate admin profile for audit logging downstream
      req.adminProfile = profile;

      next();
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      res.status(500).json({ error: "Internal server error during authorization" });
    }
  };
};

// Types to extend Express Request
declare global {
  namespace Express {
    interface Request {
      adminProfile?: unknown;
    }
  }
}
