// Email verification by 6-digit code, plus the `role: authenticated` claim Supabase needs.
//   POST { action: "send" }              → emails a code (1 per minute)
//   POST { action: "verify", code }      → checks it (10 min, 5 tries), marks the email verified, grants the claim
//   POST { action: "claims" }            → for people whose token already says email_verified (Google sign-in)
// After "verify" or "claims" the browser must refresh its ID token to pick up the new claim.
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { serviceClient } from "../_shared/db.ts";
import { grantAuthenticated, verifyFirebaseToken } from "../_shared/firebase.ts";
import { handler, HttpError, json, readJson } from "../_shared/http.ts";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

/** Bound to the uid, so a leaked row cannot be replayed for another account. */
export const hashCode = (uid: string, code: string, pepper = Deno.env.get("EMAIL_CODE_PEPPER") ?? "") =>
  createHash("sha256").update(`${uid}:${code}:${pepper}`).digest("hex");

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export function codesMatch(expectedHex: string, uid: string, code: string, pepper?: string): boolean {
  const a = Buffer.from(expectedHex, "hex");
  const b = Buffer.from(hashCode(uid, code, pepper), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function deliver(email: string, code: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    // Local development only: never log codes where real people sign up.
    if (Deno.env.get("ENVIRONMENT") === "development") return console.log(`[dev] code for ${email}: ${code}`);
    throw new Error("RESEND_API_KEY is not set");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") ?? "ReuseDo <no-reply@reusedo.com>",
      to: email,
      subject: `ReuseDo ভেরিফিকেশন কোড: ${code}`,
      text:
        `আপনার ReuseDo কোড: ${code}\nকোডটি ১০ মিনিট কার্যকর। আপনি না চাইলে এটি উপেক্ষা করুন।\n\nYour ReuseDo code: ${code} (valid for 10 minutes).`,
    }),
  });
  if (!res.ok) throw new Error(`Email provider answered ${res.status}`);
}

if (import.meta.main) {
  Deno.serve(handler(async (req) => {
    const user = await verifyFirebaseToken(req);
    const body = await readJson<{ action?: string; code?: string }>(req);
    const db = serviceClient();

    if (body.action === "claims") {
      // Only trusted because the token's signature was verified above.
      if (!user.emailVerified) throw new HttpError(403, "email_not_verified");
      if (!user.hasRoleClaim) await grantAuthenticated(user.uid);
      return json(req, { ok: true });
    }

    if (body.action === "send") {
      if (!user.email) throw new HttpError(400, "no_email");
      if (user.emailVerified) return json(req, { ok: true, alreadyVerified: true });
      const { data: existing } = await db.from("email_verification_codes")
        .select("last_sent_at").eq("firebase_uid", user.uid).maybeSingle();
      if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < RESEND_COOLDOWN_MS) {
        throw new HttpError(429, "cooldown", "Wait a minute before asking for a new code");
      }
      const code = newCode();
      const { error } = await db.from("email_verification_codes").upsert({
        firebase_uid: user.uid,
        code_hash: hashCode(user.uid, code),
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
        attempts: 0,
        last_sent_at: new Date().toISOString(),
      });
      if (error) throw error;
      await deliver(user.email, code);
      return json(req, { ok: true });
    }

    if (body.action === "verify") {
      const code = (body.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) throw new HttpError(400, "invalid_code");
      const { data: row } = await db.from("email_verification_codes")
        .select("code_hash, expires_at, attempts").eq("firebase_uid", user.uid).maybeSingle();
      if (!row) throw new HttpError(400, "not_found", "Request a code first");
      if (new Date(row.expires_at).getTime() < Date.now()) throw new HttpError(400, "expired");
      if (row.attempts >= MAX_ATTEMPTS) throw new HttpError(429, "too_many_attempts");
      if (!codesMatch(row.code_hash, user.uid, code)) {
        await db.from("email_verification_codes").update({ attempts: row.attempts + 1 }).eq("firebase_uid", user.uid);
        throw new HttpError(400, "invalid_code");
      }
      await grantAuthenticated(user.uid, { emailVerified: true });
      await db.from("email_verification_codes").delete().eq("firebase_uid", user.uid);
      return json(req, { ok: true });
    }

    throw new HttpError(400, "bad_action");
  }));
}
