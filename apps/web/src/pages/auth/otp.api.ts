import { AuthService } from "@/features/auth";
import { resetSupabaseSession } from "@/features/auth/session";
import { queryClient } from "@/services/queryClient";
import { FunctionError, callFunction, supabase } from "@/services/supabase";
import { UI_PREVIEW } from "@/shared/uiPreview";

// The email code is handled by the `email-code` Edge Function (supabase/functions/email-code): the code is hashed,
// expires in 10 minutes, allows 5 wrong tries and one resend a minute. On success it also marks the Firebase email
// verified and adds the claim Supabase needs. Dev shortcut: VITE_USE_MOCK=true accepts 123456 without a backend.
const MOCK = import.meta.env.DEV && (UI_PREVIEW || import.meta.env.VITE_USE_MOCK === "true");

const fail = (e: unknown): never => {
  if (e instanceof FunctionError) throw new Error(e.code === "invalid_code" ? "invalid_code" : e.code);
  throw new Error("network");
};

export async function sendEmailCode(): Promise<void> {
  if (MOCK) return;
  try {
    await callFunction("email-code", { action: "send" });
  } catch (e) {
    fail(e);
  }
}

export const resendEmailCode = sendEmailCode;

export async function verifyEmailCode(code: string): Promise<void> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    if (code !== "123456") throw new Error("invalid_code");
    return;
  }
  try {
    await callFunction("email-code", { action: "verify", code });
  } catch (e) {
    fail(e);
  }
  // The function flipped emailVerified and added the claim; pull a fresh token so Supabase accepts it.
  resetSupabaseSession();
  await AuthService.refreshVerification();
  await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
}

export async function saveVerificationProfile(data: {
  division: string;
  district: string;
  upazila: string;
  area: string;
  landmark: string;
  phone: string;
  /** Map pin picked during sign-up. It only helps choose the district; the exact point is deliberately not stored. */
  pin?: unknown;
}): Promise<void> {
  if (MOCK) return;
  try {
    const { error } = await supabase()
      .from("profiles")
      .update({
        phone_number: data.phone,
        division: data.division,
        district: data.district,
        upazila: data.upazila,
        area: data.area || data.upazila,
      })
      .eq("firebase_uid", (await AuthService.currentUid()) ?? "");
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  } catch (e) {
    fail(e);
  }
}
