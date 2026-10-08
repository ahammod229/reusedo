import { AuthService } from "@/features/auth";
import { apiClient } from "@/services/api";
import { UI_PREVIEW } from "@/shared/uiPreview";
import { isAxiosError } from "axios";

// Email-code endpoints live on the API (apps/api/src/services/email-code.service.ts):
// the code is hashed, expires in 10 minutes, allows 5 wrong tries and one resend a minute.
// Dev shortcut: set VITE_USE_MOCK=true and 123456 is accepted without a backend.
const MOCK = import.meta.env.DEV && (UI_PREVIEW || import.meta.env.VITE_USE_MOCK === "true");

const fail = (e: unknown): never => {
  if (isAxiosError(e)) {
    const code = e.response?.data?.code as string | undefined;
    if (code === "invalid_code") throw new Error("invalid_code");
    if (code) throw new Error(code);
  }
  throw new Error("network");
};

export async function sendEmailCode(): Promise<void> {
  if (MOCK) return;
  try {
    await apiClient.post("/auth/email-code/send");
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
    await apiClient.post("/auth/email-code/verify", { code });
  } catch (e) {
    fail(e);
  }
  // The server flipped emailVerified; pull a fresh token so later writes are accepted.
  await AuthService.refreshVerification();
}

export async function saveVerificationProfile(data: {
  division: string;
  district: string;
  upazila: string;
  area: string;
  landmark: string;
  phone: string;
  /** Optional map pin, already rounded to ~100 m. */
  pin?: [number, number];
}): Promise<void> {
  if (MOCK) return;
  try {
    // Postal code is not collected yet, so the full address book entry is created later in Settings.
    await apiClient.patch("/users/me", {
      phone_number: data.phone,
      district: data.district,
      upazila: data.upazila,
    });
    await apiClient.post("/auth/session");
  } catch (e) {
    fail(e);
  }
}
