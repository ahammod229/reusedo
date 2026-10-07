export type PostKind = "offer" | "need";

/** Study level, so students find books and gear for their class. */
export type EduLevel = "primary" | "junior" | "ssc" | "hsc" | "admission" | "university";

export const EDU_LEVELS: { id: EduLevel; bn: string; en: string; short: string }[] = [
  { id: "primary", bn: "প্রাথমিক (১–৫)", en: "Primary (1–5)", short: "১–৫" },
  { id: "junior", bn: "নিম্ন মাধ্যমিক (৬–৮)", en: "Junior (6–8)", short: "৬–৮" },
  { id: "ssc", bn: "SSC (৯–১০)", en: "SSC (9–10)", short: "SSC" },
  { id: "hsc", bn: "HSC (১১–১২)", en: "HSC (11–12)", short: "HSC" },
  { id: "admission", bn: "ভর্তি প্রস্তুতি", en: "Admission prep", short: "ভর্তি" },
  { id: "university", bn: "বিশ্ববিদ্যালয়", en: "University", short: "বিশ্ববিদ্যালয়" },
];
export const eduOf = (id?: EduLevel) => EDU_LEVELS.find((l) => l.id === id);

export type Delivery = "pickup" | "courier";
/** Set by the poster only — never shown as a countdown. */
export type Urgency = "urgent" | "soon" | "anytime";

export interface FeedPost {
  id: string;
  kind: PostKind;
  title: string;
  description: string;
  category: CategoryId;
  condition: "new" | "good" | "used";
  area: string;
  district: string;
  distanceKm: number;
  author: { name: string; username: string; verified: boolean; trust: number };
  images: string[];
  postedAt: string;
  /** For sorting/filtering by recency. */
  hoursAgo: number;
  requests: number;
  /** Study level and a free detail like "ক্লাস ৮ · বাংলা ভার্সন". */
  edu?: { level: EduLevel; detail?: string };
  delivery: Delivery[];
  urgency?: Urgency;
  qty?: number;
  /** "given" posts stay visible for a while as social proof. */
  status: "available" | "reserved" | "given";
}

export type CategoryId =
  | "books"
  | "stationery"
  | "furniture"
  | "clothes"
  | "electronics"
  | "kids"
  | "other";

export const CATEGORIES: { id: CategoryId; bn: string; en: string; emoji: string; tone: string }[] =
  [
    {
      id: "books",
      bn: "বই",
      en: "Books",
      emoji: "📚",
      tone: "from-amber-100 to-amber-200 dark:from-white/10 dark:to-white/5",
    },
    {
      id: "stationery",
      bn: "খাতা-কলম",
      en: "Stationery",
      emoji: "📓",
      tone: "from-sky-100 to-sky-200 dark:from-white/10 dark:to-white/5",
    },
    {
      id: "furniture",
      bn: "আসবাব",
      en: "Furniture",
      emoji: "🪑",
      tone: "from-orange-100 to-orange-200 dark:from-white/10 dark:to-white/5",
    },
    {
      id: "clothes",
      bn: "কাপড়",
      en: "Clothes",
      emoji: "👕",
      tone: "from-rose-100 to-rose-200 dark:from-white/10 dark:to-white/5",
    },
    {
      id: "electronics",
      bn: "ইলেকট্রনিক্স",
      en: "Electronics",
      emoji: "🔌",
      tone: "from-indigo-100 to-indigo-200 dark:from-white/10 dark:to-white/5",
    },
    {
      id: "kids",
      bn: "শিশুদের",
      en: "Kids",
      emoji: "🧸",
      tone: "from-pink-100 to-pink-200 dark:from-white/10 dark:to-white/5",
    },
    {
      id: "other",
      bn: "অন্যান্য",
      en: "Other",
      emoji: "🎁",
      tone: "from-emerald-100 to-emerald-200 dark:from-white/10 dark:to-white/5",
    },
  ];

export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[6];

export interface CourierRequestItem {
  id: string;
  item: string;
  category: CategoryId;
  giver: { name: string; phone: string; address: string };
  receiver: { name: string; phone: string; address: string };
  weightKg: number;
  charge: number;
  status: "pending" | "confirmed" | "rejected";
  /** Steadfast tracking code, set when an admin confirms. */
  tracking?: string;
  createdAt: string;
}
