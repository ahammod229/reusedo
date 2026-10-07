import type { CategoryId } from "./types";

// Recognition, not competition (docs/STUDENT_UX.md §2–3): levels only go up,
// there are no streaks, and nobody is ranked against anyone else.

export interface ImpactStats {
  given: number;
  received: number;
  booksGiven: number;
  thanksReceived: number;
  thanksWritten: number;
  /** People helped within the user's own district. */
  localHelped: number;
  /** Estimated kg kept out of the bin (see KG_PER_ITEM). */
  kgSaved: number;
  /** Median minutes to first reply; null until there is enough data. */
  responseMins: number | null;
  trust: number;
}

/** Rough per-item weights for the "kg saved" estimate. Shown as an estimate, never as fact. */
export const KG_PER_ITEM: Record<CategoryId, number> = {
  books: 2,
  stationery: 0.5,
  furniture: 10,
  clothes: 1,
  electronics: 2,
  kids: 1.5,
  other: 1,
};

export const LEVELS = [
  { min: 0, emoji: "🌱", bn: "নতুন বন্ধু", en: "New friend" },
  { min: 1, emoji: "🤝", bn: "সহায়ক", en: "Helper" },
  { min: 5, emoji: "📚", bn: "বইবন্ধু", en: "Book buddy" },
  { min: 15, emoji: "🌟", bn: "কমিউনিটি হিরো", en: "Community hero" },
  { min: 40, emoji: "🏆", bn: "কিংবদন্তি", en: "Legend" },
] as const;

/** Level from items given. Receiving never lowers anything. */
export function levelOf(given: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && given >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (given - cur.min) / (next.min - cur.min) : 1;
  return { index: i, ...cur, next, toNext: next ? next.min - given : 0, progress };
}

export interface Badge {
  id: string;
  emoji: string;
  bn: string;
  en: string;
  howBn: string;
  howEn: string;
  value: number;
  target: number;
  done: boolean;
}

export function badgesOf(s: ImpactStats): Badge[] {
  const b = (
    id: string,
    emoji: string,
    bn: string,
    en: string,
    howBn: string,
    howEn: string,
    value: number,
    target: number,
  ): Badge => ({
    id,
    emoji,
    bn,
    en,
    howBn,
    howEn,
    value: Math.min(value, target),
    target,
    done: value >= target,
  });
  return [
    b("first", "🎁", "প্রথম দান", "First gift", "১টি জিনিস দিন", "Give 1 item", s.given, 1),
    b("books", "📖", "বইপোকা", "Bookworm", "৫টি বই দিন", "Give 5 books", s.booksGiven, 5),
    b(
      "local",
      "🏘️",
      "এলাকার বন্ধু",
      "Neighbour",
      "নিজের জেলায় ৫ জনকে দিন",
      "Help 5 people in your district",
      s.localHelped,
      5,
    ),
    b(
      "thanks",
      "💌",
      "ভালোবাসা পেয়েছেন",
      "Loved",
      "১০টি ধন্যবাদ নোট পান",
      "Receive 10 thank-you notes",
      s.thanksReceived,
      10,
    ),
    b(
      "grateful",
      "🙏",
      "কৃতজ্ঞ মন",
      "Grateful",
      "৩টি ধন্যবাদ নোট লিখুন",
      "Write 3 thank-you notes",
      s.thanksWritten,
      3,
    ),
    b(
      "green",
      "🌍",
      "পরিবেশবন্ধু",
      "Planet friend",
      "আনুমানিক ২০ কেজি বাঁচান",
      "Save ~20 kg",
      Math.round(s.kgSaved),
      20,
    ),
    b("trusted", "🛡️", "বিশ্বস্ত", "Trusted", "ট্রাস্ট স্কোর ৯০", "Reach trust 90", s.trust, 90),
    b(
      "fast",
      "⚡",
      "দ্রুত উত্তর",
      "Quick replier",
      "গড়ে ১ ঘণ্টার মধ্যে উত্তর দিন",
      "Reply within an hour on average",
      s.responseMins !== null && s.responseMins <= 60 ? 1 : 0,
      1,
    ),
  ];
}

/** "Usually replies within …" — honest buckets, only when we have data. */
export function replyLabel(mins: number | null, tr: (bn: string, en: string) => string) {
  if (mins === null) return null;
  if (mins <= 60) return tr("সাধারণত ১ ঘণ্টার মধ্যে উত্তর দেন", "Usually replies within an hour");
  if (mins <= 360) return tr("সাধারণত কয়েক ঘণ্টায় উত্তর দেন", "Usually replies within hours");
  return tr("সাধারণত ১ দিনের মধ্যে উত্তর দেন", "Usually replies within a day");
}
