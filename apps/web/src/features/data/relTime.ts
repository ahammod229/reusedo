import { useLang } from "@/features/feed/i18n";

const BN = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const digits = (n: number, bn: boolean) =>
  bn ? String(n).replace(/\d/g, (d) => BN[Number(d)]) : String(n);

/** "২ ঘণ্টা আগে" / "2 hours ago" in the language the app is showing now. */
export function relTime(iso: string, now = Date.now()): string {
  const bn = useLang.getState().lang === "bn";
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (mins < 1) return bn ? "এখনই" : "just now";
  if (mins < 60) return bn ? `${digits(mins, bn)} মিনিট আগে` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return bn ? `${digits(hours, bn)} ঘণ্টা আগে` : `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return bn ? `${digits(days, bn)} দিন আগে` : `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return bn ? `${digits(months, bn)} মাস আগে` : `${months} month${months > 1 ? "s" : ""} ago`;
}

/** Clock time for chat bubbles, e.g. "১০:২৪". */
export function clock(iso: string): string {
  const bn = useLang.getState().lang === "bn";
  const d = new Date(iso);
  const s = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return bn ? s.replace(/\d/g, (c) => BN[Number(c)]) : s;
}

const MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

/** "অক্টোবর ২০২৬" */
export function monthYear(iso: string): string {
  const bn = useLang.getState().lang === "bn";
  const d = new Date(iso);
  return bn
    ? `${MONTHS_BN[d.getMonth()]} ${digits(d.getFullYear(), true)}`
    : d.toLocaleDateString("en", { month: "long", year: "numeric" });
}
