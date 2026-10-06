import type { CourierRequestItem, FeedPost } from "./types";

// Placeholder data so the UI renders without the API. Swap for the real
// products/needs services once the unified feed endpoint exists.
export const MOCK_POSTS: FeedPost[] = [
  {
    id: "1",
    kind: "offer",
    title: "ক্লাস ৮-এর সব বই (সেট)",
    description: "গত বছরের সব বই, ভালো অবস্থায়। দুটো বইয়ে সামান্য দাগ আছে।",
    category: "books",
    condition: "good",
    area: "মিরপুর ১০",
    district: "ঢাকা",
    distanceKm: 1.2,
    author: { name: "রাকিব হাসান", verified: true, trust: 92 },
    images: [],
    postedAt: "২ ঘণ্টা আগে",
    requests: 3,
  },
  {
    id: "2",
    kind: "need",
    title: "পড়ার টেবিল দরকার",
    description: "ক্লাস ৯-এর একজন ছাত্রের জন্য ছোট একটা পড়ার টেবিল দরকার।",
    category: "furniture",
    condition: "used",
    area: "উত্তরা সেক্টর ৪",
    district: "ঢাকা",
    distanceKm: 3.4,
    author: { name: "সুমাইয়া আক্তার", verified: true, trust: 78 },
    images: [],
    postedAt: "৪ ঘণ্টা আগে",
    requests: 1,
  },
  {
    id: "3",
    kind: "offer",
    title: "নতুন খাতা ১২টি",
    description: "অতিরিক্ত কেনা হয়েছিল, একদম নতুন, ব্যবহার হয়নি।",
    category: "stationery",
    condition: "new",
    area: "ধানমন্ডি ১৫",
    district: "ঢাকা",
    distanceKm: 5.1,
    author: { name: "তানভীর আহমেদ", verified: false, trust: 40 },
    images: [],
    postedAt: "৬ ঘণ্টা আগে",
    requests: 0,
  },
  {
    id: "4",
    kind: "offer",
    title: "শিশুর শীতের জামা (২–৩ বছর)",
    description: "ধোয়া ও পরিষ্কার, ৫টি জামা।",
    category: "clothes",
    condition: "good",
    area: "আগ্রাবাদ",
    district: "চট্টগ্রাম",
    distanceKm: 214,
    author: { name: "নাজমা বেগম", verified: true, trust: 88 },
    images: [],
    postedAt: "১ দিন আগে",
    requests: 5,
  },
  {
    id: "5",
    kind: "need",
    title: "পুরনো ল্যাপটপ (পড়াশোনার জন্য)",
    description: "অনলাইন ক্লাসের জন্য যেকোনো চালু ল্যাপটপ হলেই চলবে।",
    category: "electronics",
    condition: "used",
    area: "জিন্দাবাজার",
    district: "সিলেট",
    distanceKm: 240,
    author: { name: "ফাহিম রহমান", verified: true, trust: 70 },
    images: [],
    postedAt: "১ দিন আগে",
    requests: 2,
  },
  {
    id: "6",
    kind: "offer",
    title: "কাঠের বুকশেলফ",
    description: "৪ তাক বিশিষ্ট, নিজে এসে নিতে হবে অথবা কুরিয়ারে।",
    category: "furniture",
    condition: "used",
    area: "কাজীপাড়া",
    district: "ঢাকা",
    distanceKm: 1.9,
    author: { name: "মাহবুব আলম", verified: true, trust: 95 },
    images: [],
    postedAt: "২ দিন আগে",
    requests: 4,
  },
  {
    id: "7",
    kind: "offer",
    title: "খেলনা গাড়ি ও ব্লক সেট",
    description: "বাচ্চারা বড় হয়ে গেছে, খেলনাগুলো ভালো আছে।",
    category: "kids",
    condition: "good",
    area: "সদর",
    district: "রাজশাহী",
    distanceKm: 250,
    author: { name: "শিউলি খাতুন", verified: false, trust: 52 },
    images: [],
    postedAt: "২ দিন আগে",
    requests: 0,
  },
  {
    id: "8",
    kind: "need",
    title: "গল্পের বই — শিশুদের জন্য",
    description: "এতিমখানার লাইব্রেরির জন্য যেকোনো গল্পের বই।",
    category: "books",
    condition: "used",
    area: "মিরপুর ১১",
    district: "ঢাকা",
    distanceKm: 2.2,
    author: { name: "আলোর পথে ফাউন্ডেশন", verified: true, trust: 99 },
    images: [],
    postedAt: "৩ দিন আগে",
    requests: 7,
  },
];

export const MOCK_COURIER: CourierRequestItem[] = [
  {
    id: "c1",
    item: "ক্লাস ৮-এর সব বই (সেট)",
    category: "books",
    giver: { name: "রাকিব হাসান", phone: "01711-000001", address: "মিরপুর ১০, ঢাকা" },
    receiver: { name: "ফাহিম রহমান", phone: "01811-000002", address: "জিন্দাবাজার, সিলেট" },
    weightKg: 3,
    charge: 130,
    status: "pending",
    createdAt: "আজ, ১০:২০",
  },
  {
    id: "c2",
    item: "শিশুর শীতের জামা",
    category: "clothes",
    giver: { name: "নাজমা বেগম", phone: "01911-000003", address: "আগ্রাবাদ, চট্টগ্রাম" },
    receiver: { name: "সুমাইয়া আক্তার", phone: "01611-000004", address: "উত্তরা সেক্টর ৪, ঢাকা" },
    weightKg: 1,
    charge: 110,
    status: "pending",
    createdAt: "গতকাল, ১৬:০৫",
  },
  {
    id: "c3",
    item: "কাঠের বুকশেলফ",
    category: "furniture",
    giver: { name: "মাহবুব আলম", phone: "01511-000005", address: "কাজীপাড়া, ঢাকা" },
    receiver: { name: "তানভীর আহমেদ", phone: "01311-000006", address: "ধানমন্ডি ১৫, ঢাকা" },
    weightKg: 12,
    charge: 250,
    status: "confirmed",
    createdAt: "২ দিন আগে",
  },
];

// Shown in ad slots until a real Ad Manager network code is configured.
export const MOCK_ADS = [
  {
    id: "a1",
    brand: "স্থানীয় বইয়ের দোকান",
    headline: "ব্যবহৃত বই কিনুন অর্ধেক দামে",
    body: "ঢাকার সব এলাকায় ফ্রি হোম ডেলিভারি।",
    cta: "দেখুন",
  },
  {
    id: "a2",
    brand: "শিক্ষা অ্যাপ",
    headline: "ঘরে বসে পড়াশোনা — ৭ দিন ফ্রি",
    body: "এসএসসি ও এইচএসসি-র সব বিষয়।",
    cta: "ট্রাই করুন",
  },
];

export interface MockUser {
  username: string;
  name: string;
  verified: boolean;
  trust: number;
  area: string;
  district: string;
  joined: string;
  given: number;
  received: number;
  bio: string;
  badges: string[];
  reviews: { by: string; stars: number; text: string; when: string }[];
}

export const MOCK_USERS: Record<string, MockUser> = {
  rakib: {
    username: "rakib",
    name: "রাকিব হাসান",
    verified: true,
    trust: 92,
    area: "মিরপুর ১০",
    district: "ঢাকা",
    joined: "জানুয়ারি ২০২৬",
    given: 14,
    received: 3,
    bio: "পড়ার বই আর খাতা দিয়ে দিতে ভালো লাগে। শিক্ষার্থীদের কাজে লাগলেই খুশি।",
    badges: ["ইমেইল যাচাই", "ঠিকানা যাচাই", "১০+ দান"],
    reviews: [
      { by: "সুমাইয়া আক্তার", stars: 5, text: "খুব ভালো মানুষ, সময়মতো বই পেয়েছি।", when: "২ সপ্তাহ আগে" },
      { by: "ফাহিম রহমান", stars: 5, text: "কুরিয়ারে ঠিকমতো প্যাক করে পাঠিয়েছেন।", when: "১ মাস আগে" },
      {
        by: "তানভীর আহমেদ",
        stars: 4,
        text: "একটু দেরিতে উত্তর দেন, তবে জিনিস ভালো ছিল।",
        when: "২ মাস আগে",
      },
    ],
  },
};

export interface MockConversation {
  id: string;
  with: string;
  verified: boolean;
  postTitle: string;
  postKind: "offer" | "need";
  last: string;
  when: string;
  unread: number;
  messages: { from: "me" | "them" | "system"; text: string; time: string }[];
}

export const MOCK_CHATS: MockConversation[] = [
  {
    id: "c1",
    with: "রাকিব হাসান",
    verified: true,
    postTitle: "ক্লাস ৮-এর সব বই (সেট)",
    postKind: "offer",
    last: "ঠিক আছে, কুরিয়ারেই পাঠাব।",
    when: "১০:২৪",
    unread: 2,
    messages: [
      { from: "system", text: "আপনি এই পোস্টে রিকোয়েস্ট পাঠিয়েছেন।", time: "০৯:৫০" },
      { from: "them", text: "আসসালামু আলাইকুম, বইগুলো এখনও আছে। আপনি কোথায় থাকেন?", time: "১০:০২" },
      { from: "me", text: "ওয়ালাইকুম আসসালাম। আমি সিলেটে থাকি, জিন্দাবাজারে।", time: "১০:১১" },
      {
        from: "them",
        text: "ঢাকা থেকে সিলেট দূরে, কুরিয়ারে পাঠানো যায়। চার্জ আপনাকে দিতে হবে।",
        time: "১০:১৮",
      },
      { from: "me", text: "ঠিক আছে, আমি চার্জ দেব।", time: "১০:২১" },
      { from: "them", text: "ঠিক আছে, কুরিয়ারেই পাঠাব।", time: "১০:২৪" },
    ],
  },
  {
    id: "c2",
    with: "সুমাইয়া আক্তার",
    verified: true,
    postTitle: "পড়ার টেবিল দরকার",
    postKind: "need",
    last: "আমার কাছে একটা ছোট টেবিল আছে।",
    when: "গতকাল",
    unread: 0,
    messages: [{ from: "me", text: "আমার কাছে একটা ছোট টেবিল আছে।", time: "গতকাল" }],
  },
  {
    id: "c3",
    with: "আলোর পথে ফাউন্ডেশন",
    verified: true,
    postTitle: "গল্পের বই — শিশুদের জন্য",
    postKind: "need",
    last: "অনেক ধন্যবাদ! আমরা নিয়ে যাব।",
    when: "সোমবার",
    unread: 0,
    messages: [{ from: "them", text: "অনেক ধন্যবাদ! আমরা নিয়ে যাব।", time: "সোমবার" }],
  },
];

export type ExchangeStatus = "requested" | "accepted" | "scheduled" | "completed" | "cancelled";

export interface MockExchange {
  id: string;
  title: string;
  category: import("./types").CategoryId;
  role: "giver" | "receiver";
  other: string;
  status: ExchangeStatus;
  via: "pickup" | "courier";
  updated: string;
}

export const MOCK_EXCHANGES: MockExchange[] = [
  {
    id: "e1",
    title: "ক্লাস ৮-এর সব বই (সেট)",
    category: "books",
    role: "receiver",
    other: "রাকিব হাসান",
    status: "accepted",
    via: "courier",
    updated: "আজ ১০:২৪",
  },
  {
    id: "e2",
    title: "কাঠের বুকশেলফ",
    category: "furniture",
    role: "giver",
    other: "তানভীর আহমেদ",
    status: "scheduled",
    via: "pickup",
    updated: "গতকাল",
  },
  {
    id: "e3",
    title: "নতুন খাতা ১২টি",
    category: "stationery",
    role: "giver",
    other: "মিতা দাস",
    status: "requested",
    via: "pickup",
    updated: "২ দিন আগে",
  },
  {
    id: "e4",
    title: "শিশুর শীতের জামা",
    category: "clothes",
    role: "receiver",
    other: "নাজমা বেগম",
    status: "completed",
    via: "courier",
    updated: "গত সপ্তাহ",
  },
  {
    id: "e5",
    title: "পুরনো ল্যাপটপ",
    category: "electronics",
    role: "giver",
    other: "ফাহিম রহমান",
    status: "cancelled",
    via: "pickup",
    updated: "গত মাস",
  },
];

export interface MockNotification {
  id: string;
  kind: "request" | "accepted" | "message" | "courier" | "match" | "review";
  text: string;
  when: string;
  unread: boolean;
  href: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n1",
    kind: "message",
    text: "রাকিব হাসান আপনাকে মেসেজ পাঠিয়েছেন",
    when: "১০ মিনিট আগে",
    unread: true,
    href: "/messages/c1",
  },
  {
    id: "n2",
    kind: "courier",
    text: "আপনার কুরিয়ার রিকোয়েস্ট অনুমোদিত হয়েছে। ট্র্যাকিং: SF48201937",
    when: "১ ঘণ্টা আগে",
    unread: true,
    href: "/courier",
  },
  {
    id: "n3",
    kind: "request",
    text: "তানভীর আহমেদ আপনার ‘কাঠের বুকশেলফ’ চেয়েছেন",
    when: "৩ ঘণ্টা আগে",
    unread: true,
    href: "/exchanges",
  },
  {
    id: "n4",
    kind: "match",
    text: "আপনার খোঁজা ‘পড়ার টেবিল’ মিলতে পারে এমন নতুন পোস্ট এসেছে",
    when: "গতকাল",
    unread: false,
    href: "/feed",
  },
  {
    id: "n5",
    kind: "accepted",
    text: "নাজমা বেগম আপনার রিকোয়েস্ট গ্রহণ করেছেন",
    when: "গতকাল",
    unread: false,
    href: "/exchanges",
  },
  {
    id: "n6",
    kind: "review",
    text: "সুমাইয়া আক্তার আপনাকে ৫ তারা রিভিউ দিয়েছেন",
    when: "গত সপ্তাহ",
    unread: false,
    href: "/profile",
  },
];
