import { type Lang, useLang } from "@/features/feed/i18n";

// The API sends ISO timestamps; these turn them into the short labels the UI shows,
// in the current language. Read outside React, so they use the store's current value.

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

const current = () => useLang.getState().lang;

export const hoursSince = (iso: string) =>
  Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);

/** "just now", "12 minutes ago", "3 hours ago", "yesterday", "4 days ago", then a date. */
export function relTime(iso: string, lang: Lang = current()): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  const bn = lang === "bn";
  const n = (v: number) => (bn ? bnNum(v) : String(v));
  if (mins < 1) return bn ? "এইমাত্র" : "just now";
  if (mins < 60) return bn ? `${n(mins)} মিনিট আগে` : `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return bn ? `${n(hours)} ঘণ্টা আগে` : `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return bn ? "গতকাল" : "yesterday";
  if (days < 7) return bn ? `${n(days)} দিন আগে` : `${days} days ago`;
  return longDate(iso, lang);
}

/** "10:24" for today, otherwise a short date. Used for chat messages. */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  if (!today) return longDate(iso);
  const t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return current() === "bn" ? bnNum(t) : t;
}

export function longDate(iso: string, lang: Lang = current()): string {
  return new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    ...(new Date(iso).getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
}

/** "January 2026" for "member since". */
export const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString(current() === "bn" ? "bn-BD" : "en-GB", {
    month: "long",
    year: "numeric",
  });
