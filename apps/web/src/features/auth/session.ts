import { FunctionError, callFunction } from "@/services/supabase";
import type { User } from "firebase/auth";

/** Reads the `role` claim out of an ID token without verifying it (verification happens server-side). */
function roleOf(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role;
  } catch {
    return undefined;
  }
}

let inflight: { uid: string; promise: Promise<void> } | undefined;

/**
 * Supabase only treats a Firebase token as "signed in" once it carries `role: authenticated`. New email accounts get
 * it when they confirm the 6-digit code; Google accounts (already verified) get it here, once, on first use.
 * Safe to call repeatedly: concurrent callers share one attempt.
 */
export function ensureSupabaseSession(user: User): Promise<void> {
  if (inflight?.uid === user.uid) return inflight.promise;
  const promise = (async () => {
    if (!user.emailVerified) return;
    const token = await user.getIdToken();
    if (roleOf(token) === "authenticated") return;
    try {
      await callFunction("email-code", { action: "claims" });
    } catch (e) {
      if (e instanceof FunctionError && e.code === "email_not_verified") return;
      throw e;
    }
    await user.getIdToken(true); // pick up the new claim
  })();
  inflight = { uid: user.uid, promise };
  // A failed attempt must not be cached forever.
  promise.catch(() => {
    if (inflight?.promise === promise) inflight = undefined;
  });
  return promise;
}

export const resetSupabaseSession = () => {
  inflight = undefined;
};
