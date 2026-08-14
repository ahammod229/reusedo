import { UserRepository } from "../database";
import { Router } from "express";
import { adminAuth } from "../config/firebase-admin";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const userRepo = UserRepository;

router.post("/session", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];

    // 1. Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 2. Load or sync user profile
    const profile = await userRepo.syncProfile({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || "",
      displayName: decodedToken.name || "User",
      avatarUrl: decodedToken.picture || null,
    });

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Session Error:", error);
    res.status(401).json({ success: false, message: "Invalid session token" });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  // In a stateless JWT setup, logout is primarily handled client-side by dropping the token.
  // We can invalidate tokens or clear cookies here if needed.
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

router.get("/me", requireAuth, (req, res) => {
  // Profile is attached by requireAuth middleware
  res.status(200).json({ success: true, profile: req.user?.profile });
});

export default router;
