import { Router } from "express";
import { userLimit } from "../lib/limits";
import { me, requireAuthUnverified as requireAuth } from "../middlewares/auth.middleware";
import { EmailCodeError, emailCodeService } from "../services/email-code.service";

const router = Router();

// POST /api/auth/session — called after every sign-in. The middleware creates the
// profile on first use; this just confirms it and returns the basics.
router.post("/session", requireAuth, (req, res) => {
  const p = me(req);
  res.status(200).json({
    success: true,
    data: {
      id: p.id,
      username: p.username,
      onboarded: !!(p.district && p.phone_number),
      adminRole: p.admin_role,
    },
  });
});

router.post("/logout", requireAuth, (req, res) => {
  // In a stateless JWT setup, logout is primarily handled client-side by dropping the token.
  // We can invalidate tokens or clear cookies here if needed.
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// Per person: the service also enforces a 1-minute resend gap and 5 wrong tries.
const codeLimit = userLimit(15, 10);

// Our 6-digit codes need an email provider to send them and the Firebase service
// account to mark the address verified. Without both, the web app uses Firebase's
// own verification link instead, which needs neither.
const codesReady = () =>
  process.env.NODE_ENV !== "production" ||
  (!!process.env.RESEND_API_KEY && !!process.env.FIREBASE_PRIVATE_KEY);

router.post("/email-code/send", requireAuth, codeLimit, async (req, res) => {
  try {
    const { uid, email, email_verified } = req.user ?? {};
    if (!uid || !email)
      return res.status(400).json({ success: false, message: "No email on account" });
    if (email_verified) return res.status(200).json({ success: true, alreadyVerified: true });
    if (!codesReady())
      return res.status(503).json({
        success: false,
        code: "use_link",
        message: "Email codes are not set up; use the Firebase verification link",
      });
    await emailCodeService.send(uid, email);
    res.status(200).json({ success: true });
  } catch (error) {
    sendCodeError(res, error);
  }
});

router.post("/email-code/verify", requireAuth, codeLimit, async (req, res) => {
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
    return res
      .status(error.status)
      .json({ success: false, code: error.code, message: error.message });
  }
  console.error("Email code error:", error);
  return res.status(500).json({ success: false, message: "Could not process the code" });
}

export default router;
