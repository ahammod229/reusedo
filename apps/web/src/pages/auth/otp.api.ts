// Seam for the email-code endpoints. The real calls (send 6-digit code via the
// email provider, verify with expiry + attempt limits) arrive with the backend.
// Until then the dev build accepts 123456 so the flow can be reviewed; the
// production build refuses instead of faking a verified account.
const NOT_READY = "Email verification is not connected yet.";

export async function verifyEmailCode(code: string): Promise<void> {
  if (!import.meta.env.DEV) throw new Error(NOT_READY);
  await new Promise((r) => setTimeout(r, 700));
  if (code !== "123456") throw new Error("invalid_code");
}

export async function resendEmailCode(): Promise<void> {
  if (!import.meta.env.DEV) throw new Error(NOT_READY);
  await new Promise((r) => setTimeout(r, 400));
}

export async function saveVerificationProfile(_data: {
  division: string;
  district: string;
  upazila: string;
  area: string;
  landmark: string;
  phone: string;
}): Promise<void> {
  if (!import.meta.env.DEV) throw new Error(NOT_READY);
  await new Promise((r) => setTimeout(r, 700));
}
