import { pendingCourierCount } from "@/features/data/mockSource";
import { store } from "@/features/data/platformStore";
import { extraMock, openRiskCount } from "./mockOps";
import type {
  AdminCategory,
  AdminContentPage,
  AdminExchange,
  AdminFlag,
  AdminPost,
  AdminReport,
  AdminReview,
  AdminSettings,
  AdminSource,
  AdminStats,
  AdminUser,
  AdminVerification,
  AuditEntry,
} from "./types";

const wait = <T>(v: T, ms = 220) =>
  new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));

const days = [
  "২৩ সেপ্টেম্বর",
  "২৪",
  "২৫",
  "২৬",
  "২৭",
  "২৮",
  "২৯",
  "৩০",
  "১ অক্টো",
  "২",
  "৩",
  "৪",
  "৫",
  "৬ অক্টো",
];
const posts14 = [12, 15, 11, 18, 22, 19, 25, 21, 28, 24, 31, 27, 34, 38];
const exch14 = [3, 5, 4, 6, 8, 7, 9, 8, 11, 10, 12, 11, 14, 15];
const sign14 = [9, 11, 8, 14, 17, 13, 19, 16, 22, 18, 24, 21, 27, 30];

const stats: AdminStats = {
  users: 1284,
  usersDelta: 18,
  activePosts: 436,
  postsDelta: 12,
  exchangesMonth: 187,
  exchangesDelta: 24,
  pendingCourier: 2,
  openReports: 4,
  pendingVerifications: 3,
  pendingPayments: 0,
  openRisk: 0,
  series: days.map((day, i) => ({
    day,
    posts: posts14[i],
    exchanges: exch14[i],
    signups: sign14[i],
  })),
  byCategory: [
    { category: "books", count: 142 },
    { category: "clothes", count: 96 },
    { category: "furniture", count: 71 },
    { category: "stationery", count: 58 },
    { category: "kids", count: 41 },
    { category: "electronics", count: 19 },
    { category: "other", count: 9 },
  ],
  topDistricts: [
    { district: "ঢাকা", count: 188 },
    { district: "চট্টগ্রাম", count: 74 },
    { district: "সিলেট", count: 41 },
    { district: "রাজশাহী", count: 33 },
    { district: "খুলনা", count: 27 },
  ],
  ads: { impressions: 48210, clicks: 612, estRevenue: 3240 },
};

const users: AdminUser[] = [
  {
    id: "u1",
    name: "রাকিব হাসান",
    email: "rakib@example.com",
    district: "ঢাকা",
    joined: "জানু ২০২৬",
    role: "user",
    status: "active",
    verified: true,
    posts: 14,
    trust: 92,
  },
  {
    id: "u2",
    name: "সুমাইয়া আক্তার",
    email: "sumaiya@example.com",
    district: "ঢাকা",
    joined: "ফেব্রু ২০২৬",
    role: "user",
    status: "active",
    verified: true,
    posts: 5,
    trust: 78,
  },
  {
    id: "u3",
    name: "তানভীর আহমেদ",
    email: "tanvir@example.com",
    district: "ঢাকা",
    joined: "মার্চ ২০২৬",
    role: "user",
    status: "active",
    verified: false,
    posts: 2,
    trust: 40,
  },
  {
    id: "u4",
    name: "নাজমা বেগম",
    email: "nazma@example.com",
    district: "চট্টগ্রাম",
    joined: "মার্চ ২০২৬",
    role: "user",
    status: "active",
    verified: true,
    posts: 9,
    trust: 88,
  },
  {
    id: "u5",
    name: "ফাহিম রহমান",
    email: "fahim@example.com",
    district: "সিলেট",
    joined: "এপ্রিল ২০২৬",
    role: "user",
    status: "active",
    verified: true,
    posts: 3,
    trust: 70,
  },
  {
    id: "u6",
    name: "মাহবুব আলম",
    email: "mahbub@example.com",
    district: "ঢাকা",
    joined: "এপ্রিল ২০২৬",
    role: "moderator",
    status: "active",
    verified: true,
    posts: 8,
    trust: 95,
  },
  {
    id: "u7",
    name: "সন্দেহজনক অ্যাকাউন্ট",
    email: "spam123@example.com",
    district: "ঢাকা",
    joined: "অক্টো ২০২৬",
    role: "user",
    status: "suspended",
    verified: false,
    posts: 11,
    trust: 5,
  },
  {
    id: "u8",
    name: "শিউলি খাতুন",
    email: "shiuli@example.com",
    district: "রাজশাহী",
    joined: "মে ২০২৬",
    role: "user",
    status: "active",
    verified: false,
    posts: 1,
    trust: 52,
  },
];

const posts: AdminPost[] = [
  {
    id: "p1",
    title: "ক্লাস ৮-এর সব বই (সেট)",
    kind: "offer",
    author: "রাকিব হাসান",
    category: "books",
    status: "published",
    reports: 0,
    created: "২ ঘণ্টা আগে",
  },
  {
    id: "p2",
    title: "পড়ার টেবিল দরকার",
    kind: "need",
    author: "সুমাইয়া আক্তার",
    category: "furniture",
    status: "published",
    reports: 0,
    created: "৪ ঘণ্টা আগে",
  },
  {
    id: "p3",
    title: "নতুন খাতা ১২টি",
    kind: "offer",
    author: "তানভীর আহমেদ",
    category: "stationery",
    status: "published",
    reports: 1,
    created: "৬ ঘণ্টা আগে",
  },
  {
    id: "p4",
    title: "ফ্রি আইফোন নিন (লিংকে ক্লিক করুন)",
    kind: "offer",
    author: "সন্দেহজনক অ্যাকাউন্ট",
    category: "electronics",
    status: "hidden",
    reports: 6,
    created: "গতকাল",
  },
  {
    id: "p5",
    title: "শিশুর শীতের জামা (২–৩ বছর)",
    kind: "offer",
    author: "নাজমা বেগম",
    category: "clothes",
    status: "published",
    reports: 0,
    created: "১ দিন আগে",
  },
  {
    id: "p6",
    title: "পুরনো ল্যাপটপ (পড়াশোনার জন্য)",
    kind: "need",
    author: "ফাহিম রহমান",
    category: "electronics",
    status: "published",
    reports: 0,
    created: "১ দিন আগে",
  },
  {
    id: "p7",
    title: "কাঠের বুকশেলফ",
    kind: "offer",
    author: "মাহবুব আলম",
    category: "furniture",
    status: "published",
    reports: 0,
    created: "২ দিন আগে",
  },
  {
    id: "p8",
    title: "খেলনা গাড়ি ও ব্লক সেট",
    kind: "offer",
    author: "শিউলি খাতুন",
    category: "kids",
    status: "published",
    reports: 1,
    created: "২ দিন আগে",
  },
];

const exchanges: AdminExchange[] = [
  {
    id: "e1",
    item: "ক্লাস ৮-এর সব বই",
    giver: "রাকিব হাসান",
    receiver: "ফাহিম রহমান",
    status: "accepted",
    via: "courier",
    updated: "আজ ১০:২৪",
  },
  {
    id: "e2",
    item: "কাঠের বুকশেলফ",
    giver: "মাহবুব আলম",
    receiver: "তানভীর আহমেদ",
    status: "scheduled",
    via: "pickup",
    updated: "গতকাল",
  },
  {
    id: "e3",
    item: "নতুন খাতা ১২টি",
    giver: "তানভীর আহমেদ",
    receiver: "মিতা দাস",
    status: "requested",
    via: "pickup",
    updated: "২ দিন আগে",
  },
  {
    id: "e4",
    item: "শিশুর শীতের জামা",
    giver: "নাজমা বেগম",
    receiver: "সুমাইয়া আক্তার",
    status: "completed",
    via: "courier",
    updated: "গত সপ্তাহ",
  },
  {
    id: "e5",
    item: "পুরনো ল্যাপটপ",
    giver: "ফাহিম রহমান",
    receiver: "শিউলি খাতুন",
    status: "cancelled",
    via: "pickup",
    updated: "গত মাস",
  },
];

const reports: AdminReport[] = [
  {
    id: "r1",
    targetType: "post",
    targetLabel: "ফ্রি আইফোন নিন (লিংকে ক্লিক করুন)",
    reason: "fraud",
    details: "সন্দেহজনক লিংক দিয়ে ব্যক্তিগত তথ্য চাইছে।",
    reporter: "রাকিব হাসান",
    status: "open",
    created: "১ ঘণ্টা আগে",
  },
  {
    id: "r2",
    targetType: "user",
    targetLabel: "সন্দেহজনক অ্যাকাউন্ট",
    reason: "spam",
    details: "একই বিজ্ঞাপন বারবার পোস্ট করছে।",
    reporter: "সুমাইয়া আক্তার",
    status: "investigating",
    created: "৩ ঘণ্টা আগে",
  },
  {
    id: "r3",
    targetType: "post",
    targetLabel: "নতুন খাতা ১২টি",
    reason: "fake_item",
    details: "ছবির সাথে বিবরণ মিলছে না।",
    reporter: "ফাহিম রহমান",
    status: "open",
    created: "গতকাল",
  },
  {
    id: "r4",
    targetType: "message",
    targetLabel: "চ্যাট #c1 — ফোন নম্বর চাইছে",
    reason: "abuse",
    details: "বারবার ব্যক্তিগত নম্বর চাইছে।",
    reporter: "নাজমা বেগম",
    status: "open",
    created: "গতকাল",
  },
  {
    id: "r5",
    targetType: "review",
    targetLabel: "‘খারাপ মানুষ’ — অশালীন ভাষা",
    reason: "inappropriate",
    details: "রিভিউতে গালি আছে।",
    reporter: "মাহবুব আলম",
    status: "resolved",
    created: "গত সপ্তাহ",
  },
];

const verifications: AdminVerification[] = [
  {
    id: "v1",
    user: "শিউলি খাতুন",
    email: "shiuli@example.com",
    address: "সদর, রাজশাহী",
    flags: ["ফোন নম্বর আরেকটি অ্যাকাউন্টে ব্যবহৃত"],
    status: "pending",
    created: "আজ",
  },
  {
    id: "v2",
    user: "তানভীর আহমেদ",
    email: "tanvir@example.com",
    address: "ধানমন্ডি ১৫, ঢাকা",
    flags: ["একই ঠিকানায় ৩টি অ্যাকাউন্ট"],
    status: "pending",
    created: "গতকাল",
  },
  {
    id: "v3",
    user: "অজানা ইউজার",
    email: "x9@tempmail.xyz",
    address: "—",
    flags: ["অস্থায়ী (disposable) ইমেইল", "ঠিকানা অসম্পূর্ণ"],
    status: "pending",
    created: "২ দিন আগে",
  },
];

const reviews: AdminReview[] = [
  {
    id: "rv1",
    from: "সুমাইয়া আক্তার",
    to: "রাকিব হাসান",
    stars: 5,
    text: "খুব ভালো মানুষ, সময়মতো বই পেয়েছি।",
    created: "২ সপ্তাহ আগে",
    flagged: false,
  },
  {
    id: "rv2",
    from: "ফাহিম রহমান",
    to: "রাকিব হাসান",
    stars: 5,
    text: "কুরিয়ারে ঠিকমতো প্যাক করে পাঠিয়েছেন।",
    created: "১ মাস আগে",
    flagged: false,
  },
  {
    id: "rv3",
    from: "অজানা ইউজার",
    to: "মাহবুব আলম",
    stars: 1,
    text: "খারাপ মানুষ, (অশালীন শব্দ)",
    created: "গত সপ্তাহ",
    flagged: true,
  },
  {
    id: "rv4",
    from: "তানভীর আহমেদ",
    to: "রাকিব হাসান",
    stars: 4,
    text: "একটু দেরিতে উত্তর দেন, তবে জিনিস ভালো ছিল।",
    created: "২ মাস আগে",
    flagged: false,
  },
];

const categories: AdminCategory[] = [
  { id: "books", bn: "বই", en: "Books", emoji: "📚", enabled: true, posts: 142 },
  { id: "stationery", bn: "খাতা-কলম", en: "Stationery", emoji: "📓", enabled: true, posts: 58 },
  { id: "furniture", bn: "আসবাব", en: "Furniture", emoji: "🪑", enabled: true, posts: 71 },
  { id: "clothes", bn: "কাপড়", en: "Clothes", emoji: "👕", enabled: true, posts: 96 },
  { id: "electronics", bn: "ইলেকট্রনিক্স", en: "Electronics", emoji: "🔌", enabled: true, posts: 19 },
  { id: "kids", bn: "শিশুদের", en: "Kids", emoji: "🧸", enabled: true, posts: 41 },
  { id: "other", bn: "অন্যান্য", en: "Other", emoji: "🎁", enabled: true, posts: 9 },
];

const pages: AdminContentPage[] = [
  {
    slug: "terms",
    title: "শর্তাবলী",
    body: "১. ReuseDo-তে সব জিনিস বিনামূল্যে দেওয়া হয়।\n২. অস্ত্র, ওষুধ, প্রাণী ও অবৈধ জিনিস নিষিদ্ধ।",
    status: "draft",
    updated: "আজ",
  },
  {
    slug: "privacy",
    title: "প্রাইভেসি নীতি",
    body: "আমরা নাম, ইমেইল, ফোন ও ঠিকানা সংরক্ষণ করি। পাবলিকে শুধু এলাকা দেখানো হয়।",
    status: "draft",
    updated: "আজ",
  },
  {
    slug: "about",
    title: "আমাদের কথা",
    body: "ReuseDo অপ্রয়োজনীয় জিনিস যাদের দরকার তাদের কাছে পৌঁছে দেয়।",
    status: "published",
    updated: "গত সপ্তাহ",
  },
  {
    slug: "help",
    title: "সাহায্য (FAQ)",
    body: "প্রশ্ন: ReuseDo কি বিনামূল্যে?\nউত্তর: হ্যাঁ।",
    status: "published",
    updated: "গত সপ্তাহ",
  },
];

let settings: AdminSettings = {
  supportEmail: "support@reusedo.app",
  aiDailyLimit: 15,
  maxPhotos: 5,
  requestExpiryDays: 7,
  maintenanceMode: false,
};

const flags: AdminFlag[] = [
  { key: "ads_enabled", label: "বিজ্ঞাপন", description: "ফিডে Google বিজ্ঞাপন দেখান", enabled: true },
  {
    key: "ai_draft",
    label: "AI দিয়ে পোস্ট খসড়া",
    description: "ছবি থেকে শিরোনাম ও বিবরণ তৈরি (Gemini)",
    enabled: true,
  },
  { key: "courier", label: "কুরিয়ার ডেলিভারি", description: "Steadfast কুরিয়ার অনুরোধ", enabled: true },
  { key: "need_posts", label: "‘আমার দরকার’ পোস্ট", description: "চাওয়ার পোস্ট চালু", enabled: true },
  {
    key: "new_signups",
    label: "নতুন সাইন-আপ",
    description: "বন্ধ করলে নতুন অ্যাকাউন্ট খোলা যাবে না",
    enabled: true,
  },
  { key: "chat_images", label: "চ্যাটে ছবি", description: "মেসেজে ছবি পাঠানো", enabled: false },
];

const audit: AuditEntry[] = [
  {
    id: "a1",
    actor: "অ্যাডমিন",
    action: "কুরিয়ার অনুমোদন",
    target: "কাঠের বুকশেলফ (SF48201937)",
    when: "২ দিন আগে",
  },
  { id: "a2", actor: "মাহবুব আলম", action: "পোস্ট লুকানো", target: "ফ্রি আইফোন নিন", when: "গতকাল" },
  { id: "a3", actor: "অ্যাডমিন", action: "ইউজার সাসপেন্ড", target: "সন্দেহজনক অ্যাকাউন্ট", when: "গতকাল" },
];

const log = (action: string, target: string) =>
  audit.unshift({ id: `a${Date.now()}`, actor: "আপনি (অ্যাডমিন)", action, target, when: "এইমাত্র" });

const find = <T extends { id: string }>(list: T[], id: string) => {
  const x = list.find((i) => i.id === id);
  if (!x) throw new Error("not_found");
  return x;
};

export const adminMock: AdminSource = {
  // Queue counters are derived from the lists (as the real API will), so they stay consistent after actions.
  stats: () =>
    wait({
      ...stats,
      pendingCourier: pendingCourierCount(),
      openReports: reports.filter((r) => r.status === "open").length,
      pendingVerifications: verifications.filter((v) => v.status === "pending").length,
      pendingPayments: store.payments.filter((p) => p.status === "pending").length,
      openRisk: openRiskCount(),
      ads: {
        ...stats.ads,
        impressions: store.campaigns.reduce((n, a) => n + a.impressions, 0),
        clicks: store.campaigns.reduce((n, a) => n + a.clicks, 0),
      },
    }),
  listUsers: () => wait(users),
  async setUserStatus(id, status) {
    const u = find(users, id);
    u.status = status;
    log(status === "suspended" ? "ইউজার সাসপেন্ড" : "ইউজার সচল", u.name);
    return wait(undefined, 100);
  },
  listPosts: () => wait(posts),
  async setPostStatus(id, status) {
    const p = find(posts, id);
    p.status = status;
    log(
      { published: "পোস্ট পুনরুদ্ধার", hidden: "পোস্ট লুকানো", deleted: "পোস্ট মুছে ফেলা" }[status],
      p.title,
    );
    return wait(undefined, 100);
  },
  listExchanges: () => wait(exchanges),
  async cancelExchange(id) {
    const e = find(exchanges, id);
    e.status = "cancelled";
    log("এক্সচেঞ্জ বাতিল", e.item);
    return wait(undefined, 100);
  },
  listReports: () => wait(reports),
  async setReportStatus(id, status, hideTarget) {
    const r = find(reports, id);
    r.status = status;
    if (hideTarget && r.targetType === "post") {
      const p = posts.find((x) => x.title === r.targetLabel);
      if (p) p.status = "hidden";
    }
    log(`রিপোর্ট → ${status}`, r.targetLabel);
    return wait(undefined, 100);
  },
  listVerifications: () => wait(verifications),
  async decideVerification(id, status) {
    const v = find(verifications, id);
    v.status = status;
    log(status === "approved" ? "যাচাই অনুমোদন" : "যাচাই প্রত্যাখ্যান", v.user);
    return wait(undefined, 100);
  },
  listReviews: () => wait(reviews),
  async deleteReview(id) {
    const i = reviews.findIndex((r) => r.id === id);
    if (i < 0) throw new Error("not_found");
    log("রিভিউ মুছে ফেলা", `${reviews[i].from} → ${reviews[i].to}`);
    reviews.splice(i, 1);
    return wait(undefined, 100);
  },
  listCategories: () => wait(categories),
  async saveCategory(c) {
    const i = categories.findIndex((x) => x.id === c.id);
    if (i >= 0) categories[i] = { ...categories[i], ...c };
    else categories.push(c);
    log(i >= 0 ? "ক্যাটাগরি সম্পাদনা" : "ক্যাটাগরি যোগ", c.bn);
    return wait(undefined, 100);
  },
  listPages: () => wait(pages),
  async savePage(p) {
    const i = pages.findIndex((x) => x.slug === p.slug);
    const next = { ...p, updated: "এইমাত্র" };
    if (i >= 0) pages[i] = next;
    else pages.push(next);
    log(p.status === "published" ? "পেজ প্রকাশ" : "পেজ খসড়া সংরক্ষণ", p.title);
    return wait(undefined, 100);
  },
  getSettings: () => wait(settings),
  async saveSettings(s) {
    settings = { ...s };
    log("প্ল্যাটফর্ম সেটিংস পরিবর্তন", "সেটিংস");
    return wait(undefined, 100);
  },
  listFlags: () => wait(flags),
  async setFlag(key, enabled) {
    const f = flags.find((x) => x.key === key);
    if (!f) throw new Error("not_found");
    f.enabled = enabled;
    log(enabled ? "ফিচার চালু" : "ফিচার বন্ধ", f.label);
    return wait(undefined, 100);
  },
  listAudit: () => wait(audit),
  ...extraMock(log, wait),
};
