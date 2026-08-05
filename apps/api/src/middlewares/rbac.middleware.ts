import type { Request, Response, NextFunction } from "express";
import type { AdminRole } from "@reusedo/validation";
import { AdminRepository } from "@reusedo/database";
import { UserRepository } from "@reusedo/database";

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

      // Fetch user profile from database to get the admin_role
      // (Using service role internally)
      const profile = await UserRepository.getProfileByUid(user.uid);
      if (!profile || !(profile as { admin_role?: string }).admin_role) {
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }

      // Check if role is allowed
      if (!allowedRoles.includes((profile as { admin_role?: string }).admin_role as AdminRole)) {
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
