export type PostKind = "offer" | "need";

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
  author: { name: string; verified: boolean; trust: number };
  images: string[];
  postedAt: string;
  requests: number;
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
