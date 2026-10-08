import { UserRepository } from "../database";
import { Router } from "express";
import { adminAuth } from "../config/firebase-admin";
import { requireAuthUnverified as requireAuth } from "../middlewares/auth.middleware";
import { EmailCodeError, emailCodeService } from "../services/email-code.service";

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

router.post("/email-code/send", requireAuth, async (req, res) => {
  try {
    const { uid, email, email_verified } = req.user ?? {};
    if (!uid || !email) return res.status(400).json({ success: false, message: "No email on account" });
    if (email_verified) return res.status(200).json({ success: true, alreadyVerified: true });
    await emailCodeService.send(uid, email);
    res.status(200).json({ success: true });
  } catch (error) {
    sendCodeError(res, error);
  }
});

router.post("/email-code/verify", requireAuth, async (req, res) => {
  try {
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ success: false, message: "Unauthorized" });
    await emailCodeService.verify(uid, code);
    res.status(200).json({ success: true });
  } catch (error) {
    sendCodeError(res, error);
  }
});

function sendCodeError(res: import("express").Response, error: unknown) {
  if (error instanceof EmailCodeError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message });
  }
  console.error("Email code error:", error);
  return res.status(500).json({ success: false, message: "Could not process the code" });
}

export default router;
