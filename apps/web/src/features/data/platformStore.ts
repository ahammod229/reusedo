import type { CategoryId } from "@/features/feed/types";

// In-memory state shared by the public mock (feed ads, checkout) and the admin
// mock (ads manager, payments). With the real API both sides read the same
// tables, so the mocks share one store to behave the same way.

export type AdPlacement = "feed" | "sidebar" | "post_detail";

export interface AdCampaign {
  id: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  /** https:// link opened in a new tab (rel="sponsored"). */
  url: string;
  /** Image URL (data: URL in the mock; storage URL once uploads are wired). */
  image?: string;
  placements: AdPlacement[];
  /** Empty = whole country. */
  districts: string[];
  /** Empty = every category. */
  categories: CategoryId[];
  /** yyyy-mm-dd */
  start: string;
  end?: string;
  /** 1–10; higher shows more often among eligible ads. */
  weight: number;
  paused: boolean;
  impressions: number;
  clicks: number;
}

export interface AdNetworkSettings {
  adsEnabled: boolean;
  /** Google Ad Manager (AdX) fills slots when no direct ad is eligible (or always, per `priority`). */
  adxEnabled: boolean;
  networkCode: string;
  units: Record<AdPlacement, string>;
  /** One ad after every N feed posts. */
  every: number;
  sessionCap: number;
  newUserLight: boolean;
  priority: "direct_first" | "adx_first" | "mix";
}

export type PaymentMethod = "cod" | "bkash" | "nagad";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "COD",
  bkash: "bKash",
  nagad: "Nagad",
};

export interface PaymentSettings {
  methods: Record<PaymentMethod, boolean>;
  bkashNumber: string;
  nagadNumber: string;
  /** Taka. Base charge covers the first `baseWeightKg`. */
  charges: { insideDhaka: number; dhakaSuburb: number; outsideDhaka: number; perExtraKg: number };
  baseWeightKg: number;
  /** Ask for advance (bKash/Nagad) instead of COD from requests at or above this risk. */
  advanceFrom: "medium" | "high" | "never";
}

export interface Payment {
  id: string;
  courierId?: string;
  item: string;
  payer: string;
  phone: string;
  amount: number;
  method: PaymentMethod;
  trxId?: string;
  senderNumber?: string;
  status: "pending" | "verified" | "rejected" | "refunded" | "cod_due" | "cod_collected";
  /** Automatic checks, e.g. a reused transaction ID. */
  flags: string[];
  note?: string;
  created: string;
}

const today = new Date().toISOString().slice(0, 10);

export const store = {
  campaigns: [
    {
      id: "ad1",
      advertiser: "স্থানীয় বইয়ের দোকান",
      headline: "ব্যবহৃত বই কিনুন অর্ধেক দামে",
      body: "ঢাকার সব এলাকায় ফ্রি হোম ডেলিভারি।",
      cta: "দেখুন",
      url: "https://example.com/books",
      placements: ["feed", "sidebar"],
      districts: [],
      categories: [],
      start: "2026-09-01",
      weight: 5,
      paused: false,
      impressions: 18240,
      clicks: 231,
    },
    {
      id: "ad2",
      advertiser: "শিক্ষা অ্যাপ",
      headline: "ঘরে বসে পড়াশোনা — ৭ দিন ফ্রি",
      body: "এসএসসি ও এইচএসসি-র সব বিষয়।",
      cta: "ট্রাই করুন",
      url: "https://example.com/learn",
      placements: ["feed", "post_detail"],
      districts: [],
      categories: ["books", "stationery"],
      start: "2026-09-15",
      end: "2026-12-31",
      weight: 3,
      paused: false,
      impressions: 9120,
      clicks: 148,
    },
    {
      id: "ad3",
      advertiser: "চট্টগ্রাম ফার্নিচার মার্ট",
      headline: "পুরোনো আসবাব নতুনের মতো — রিপেয়ার সার্ভিস",
      body: "ঘরে এসে মাপ নিয়ে যাই।",
      cta: "কল করুন",
      url: "https://example.com/furniture",
      placements: ["feed"],
      districts: ["চট্টগ্রাম"],
      categories: [],
      start: "2026-08-01",
      end: "2026-09-30",
      weight: 4,
      paused: false,
      impressions: 4410,
      clicks: 37,
    },
  ] as AdCampaign[],

  adSettings: {
    adsEnabled: true,
    adxEnabled: false,
    networkCode: "",
    units: {
      feed: "/reusedo/feed_native",
      sidebar: "/reusedo/sidebar",
      post_detail: "/reusedo/post",
    },
    every: 6,
    sessionCap: 8,
    newUserLight: true,
    priority: "direct_first",
  } as AdNetworkSettings,

  paymentSettings: {
    methods: { cod: true, bkash: true, nagad: false },
    bkashNumber: "01700-000000",
    nagadNumber: "",
    charges: { insideDhaka: 70, dhakaSuburb: 100, outsideDhaka: 120, perExtraKg: 20 },
    baseWeightKg: 1,
    advanceFrom: "high",
  } as PaymentSettings,

  payments: [
    {
      id: "pay1",
      courierId: "c1",
      item: "ক্লাস ৮-এর সব বই (সেট)",
      payer: "ফাহিম রহমান",
      phone: "01811-000002",
      amount: 130,
      method: "bkash",
      trxId: "BK7Q2M9X1A",
      senderNumber: "01811-000002",
      status: "pending",
      flags: [],
      created: "আজ, ১০:২৫",
    },
    {
      id: "pay2",
      courierId: "c2",
      item: "শিশুর শীতের জামা",
      payer: "সুমাইয়া আক্তার",
      phone: "01611-000004",
      amount: 110,
      method: "cod",
      status: "cod_due",
      flags: [],
      created: "গতকাল, ১৬:০৬",
    },
    {
      id: "pay3",
      courierId: "c3",
      item: "কাঠের বুকশেলফ",
      payer: "তানভীর আহমেদ",
      phone: "01311-000006",
      amount: 250,
      method: "nagad",
      trxId: "NG4K8P2Z7",
      senderNumber: "01311-000006",
      status: "verified",
      flags: [],
      created: "২ দিন আগে",
    },
    {
      id: "pay4",
      item: "পুরনো ল্যাপটপ",
      payer: "অজানা ইউজার",
      phone: "0199999999",
      amount: 120,
      method: "bkash",
      trxId: "BK7Q2M9X1A",
      senderNumber: "01999-111222",
      status: "pending",
      flags: ["এই TrxID আরেকটি পেমেন্টে আগেই দেওয়া হয়েছে", "প্রেরকের নম্বর ইউজারের নম্বরের সাথে মেলে না"],
      created: "আজ, ০৯:১২",
    },
    {
      id: "pay5",
      item: "খেলনা গাড়ি ও ব্লক সেট",
      payer: "শিউলি খাতুন",
      phone: "01411-000008",
      amount: 120,
      method: "bkash",
      trxId: "BK2H5J8L0Q",
      senderNumber: "01411-000008",
      status: "refunded",
      flags: [],
      note: "দাতা জিনিস দিতে পারেননি — টাকা ফেরত দেওয়া হয়েছে",
      created: "গত সপ্তাহ",
    },
  ] as Payment[],
};

/** Ad is live now: not paused and inside its schedule. */
export function adState(a: AdCampaign, on = today): "active" | "paused" | "scheduled" | "ended" {
  if (a.paused) return "paused";
  if (a.start > on) return "scheduled";
  if (a.end && a.end < on) return "ended";
  return "active";
}

/** Only http(s) links are ever rendered as ad targets. */
export const safeAdUrl = (u: string) =>
  /^https?:\/\/[^\s]+\.[^\s]+/i.test(u.trim()) ? u.trim() : null;

/** Courier charge from the admin's rate card. */
export function courierCharge(
  zone: "insideDhaka" | "dhakaSuburb" | "outsideDhaka",
  weightKg: number,
) {
  const { charges, baseWeightKg } = store.paymentSettings;
  const extra = Math.max(0, Math.ceil(weightKg - baseWeightKg));
  return charges[zone] + extra * charges.perExtraKg;
}
