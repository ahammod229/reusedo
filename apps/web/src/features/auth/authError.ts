// Turns Firebase error codes into short, safe messages (never the raw SDK text).
const MESSAGES: Record<string, [string, string]> = {
  "auth/invalid-credential": ["ইমেইল বা পাসওয়ার্ড ভুল।", "Wrong email or password."],
  "auth/wrong-password": ["ইমেইল বা পাসওয়ার্ড ভুল।", "Wrong email or password."],
  "auth/user-not-found": ["ইমেইল বা পাসওয়ার্ড ভুল।", "Wrong email or password."],
  "auth/email-already-in-use": [
    "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে।",
    "An account with this email already exists.",
  ],
  "auth/weak-password": ["পাসওয়ার্ড আরও শক্ত দিন।", "Please choose a stronger password."],
  "auth/too-many-requests": [
    "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    "Too many attempts. Try again in a while.",
  ],
  "auth/network-request-failed": ["ইন্টারনেট সংযোগ পরীক্ষা করুন।", "Check your internet connection."],
  "auth/popup-blocked": ["পপ-আপ ব্লক করা আছে — অনুমতি দিন।", "Pop-up blocked — please allow it."],
  "auth/user-disabled": ["এই অ্যাকাউন্ট বন্ধ করা হয়েছে।", "This account has been disabled."],
};

const FALLBACK: [string, string] = [
  "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",
  "Something went wrong. Please try again.",
];

/** Cancelled popups are not errors worth showing. */
export const isSilentAuthError = (err: unknown) => {
  const code = (err as { code?: string })?.code;
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
};

export function authErrorText(err: unknown, tr: (bn: string, en: string) => string): string {
  const [bn, en] = MESSAGES[(err as { code?: string })?.code ?? ""] ?? FALLBACK;
  return tr(bn, en);
}
