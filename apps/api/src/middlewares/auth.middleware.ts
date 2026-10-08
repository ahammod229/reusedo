import { UserRepository } from "../database";
import type { NextFunction, Request, Response } from "express";
import { adminAuth } from "../config/firebase-admin";

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

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const authenticate = (enforceVerifiedEmail: boolean) => async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Fetch profile from database, or auto-create it if it doesn't exist (first login)
    const userRepo = UserRepository;
    const profile = await userRepo.syncProfile({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || "",
      displayName: decodedToken.name || (decodedToken.email ? decodedToken.email.split("@")[0] : "User"),
      avatarUrl: decodedToken.picture || null,
    });

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      profile,
    };

    // Accounts must confirm their email code before they can change anything.
    if (enforceVerifiedEmail && !decodedToken.email_verified && !SAFE_METHODS.has(req.method)) {
      return res
        .status(403)
        .json({ success: false, code: "email_not_verified", message: "Verify your email first" });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

/** Default guard: signed in, and email-verified for any write (POST/PUT/PATCH/DELETE). */
export const requireAuth = authenticate(true);

/** Signed in only. Used by the email-code endpoints themselves, which must work before verification. */
export const requireAuthUnverified = authenticate(false);
