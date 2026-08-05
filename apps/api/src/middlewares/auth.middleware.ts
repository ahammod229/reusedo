import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase-admin";
import { UserRepository } from "@reusedo/database";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        email_verified?: boolean;
        // biome-ignore lint/suspicious/noExplicitAny: Needs database type mapping
        profile?: any;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch profile from database
    const userRepo = UserRepository;
    const profile = await userRepo.getProfileByUid(decodedToken.uid);

    if (!profile) {
      return res.status(401).json({ success: false, message: "Unauthorized: Profile not found" });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      profile,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};
