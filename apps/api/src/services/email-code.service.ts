import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { adminAuth } from "../config/firebase-admin";
import { getSupabaseClient } from "../database/client";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export class EmailCodeError extends Error {
  constructor(
    public code: "cooldown" | "invalid_code" | "expired" | "too_many_attempts" | "not_found",
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// The hash is bound to the uid, so a leaked row can't be replayed for another account.
const hash = (uid: string, code: string) =>
  createHash("sha256").update(`${uid}:${code}:${process.env.EMAIL_CODE_PEPPER ?? ""}`).digest("hex");

async function deliver(email: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
    console.log(`[dev] email code for ${email}: ${code}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "ReuseDo <no-reply@reusedo.com>",
      to: email,
      subject: `ReuseDo ভেরিফিকেশন কোড: ${code}`,
      text: `আপনার ReuseDo কোড: ${code}\nকোডটি ১০ মিনিট পর্যন্ত কার্যকর। আপনি না চাইলে এটি উপেক্ষা করুন।\n\nYour ReuseDo code: ${code} (valid for 10 minutes).`,
    }),
  });
  if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
}

export const emailCodeService = {
  async send(uid: string, email: string) {
    const db = getSupabaseClient(true);
    const { data: existing } = await db
      .from("email_verification_codes")
      .select("last_sent_at")
      .eq("firebase_uid", uid)
      .maybeSingle();

    if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < RESEND_COOLDOWN_MS) {
      throw new EmailCodeError("cooldown", 429, "Please wait a minute before asking for a new code");
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { error } = await db.from("email_verification_codes").upsert({
      firebase_uid: uid,
      code_hash: hash(uid, code),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      attempts: 0,
      last_sent_at: new Date().toISOString(),
    });
    if (error) throw error;

    await deliver(email, code);
  },

  async verify(uid: string, code: string) {
    if (!/^\d{6}$/.test(code)) throw new EmailCodeError("invalid_code", 400, "Invalid code");

    const db = getSupabaseClient(true);
    const { data: row } = await db
      .from("email_verification_codes")
      .select("code_hash, expires_at, attempts")
      .eq("firebase_uid", uid)
      .maybeSingle();

    if (!row) throw new EmailCodeError("not_found", 400, "Request a code first");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new EmailCodeError("expired", 400, "Code expired — request a new one");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new EmailCodeError("too_many_attempts", 429, "Too many wrong attempts — request a new code");
    }

    const expected = Buffer.from(row.code_hash, "hex");
    const actual = Buffer.from(hash(uid, code), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      await db
        .from("email_verification_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("firebase_uid", uid);
      throw new EmailCodeError("invalid_code", 400, "Invalid code");
    }

    await adminAuth.updateUser(uid, { emailVerified: true });
    await db.from("email_verification_codes").delete().eq("firebase_uid", uid);
    await db.from("profiles").update({ email_verified_at: new Date().toISOString() }).eq("firebase_uid", uid);
  },
};
