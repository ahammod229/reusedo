import { useMe } from "@/features/feed/me";
import {
  MOCK_CHATS,
  MOCK_COURIER,
  MOCK_EXCHANGES,
  MOCK_NOTIFICATIONS,
  MOCK_POSTS,
  MOCK_USERS,
} from "@/features/feed/mock";
import type { FeedPost } from "@/features/feed/types";
import { matchesFilters, sortPosts } from "./filtering";
import { adState, safeAdUrl, store } from "./platformStore";
import type { Dashboard, DataSource, ExchangeStatus, PublicAd, UserProfile } from "./types";

// In-memory copies so mutations behave like a real backend during UI review.
const posts = structuredClone(MOCK_POSTS);
const chats = structuredClone(MOCK_CHATS);
const exchanges = structuredClone(MOCK_EXCHANGES);
const notifications = structuredClone(MOCK_NOTIFICATIONS);
const courier = structuredClone(MOCK_COURIER);

/** Lets the admin mock derive its "pending courier" counter from the same in-memory list. */
export const pendingCourierCount = () => courier.filter((c) => c.status === "pending").length;

const wait = <T>(v: T, ms = 250) =>
  new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));
const STEPS: ExchangeStatus[] = ["requested", "accepted", "scheduled", "completed"];

export const mockSource: DataSource = {
  async listFeed(f) {
    return wait(
      sortPosts(
        posts.filter((p) => matchesFilters(p, f)),
        f.sort,
      ),
    );
  },
  async getPost(id) {
    return wait(posts.find((p) => p.id === id) ?? null);
  },
  async publishPost(input) {
    const post: FeedPost = {
      id: String(Date.now()),
      kind: input.kind,
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      area: "মিরপুর ১০",
      district: "ঢাকা",
      distanceKm: 0,
      author: { name: "রাকিব হাসান", username: "rakib", verified: true, trust: 92 },
      images: input.photos.map((f) => URL.createObjectURL(f)),
      postedAt: "এইমাত্র",
      hoursAgo: 0,
      requests: 0,
      edu: input.edu,
      delivery: input.delivery,
      urgency: input.kind === "need" ? input.urgency : undefined,
      qty: input.qty,
      status: "available",
    };
    posts.unshift(post);
    return wait(post);
  },
  async aiDraft() {
    return wait(
      {
        title: "ব্যবহৃত স্কুলের বইয়ের সেট",
        description: "ভালো অবস্থায় আছে, কয়েকটি পাতায় সামান্য দাগ। বিনামূল্যে দিয়ে দিতে চাই।",
        category: "books" as const,
        condition: "good" as const,
      },
      1400,
    );
  },

  async listChats() {
    return wait(chats);
  },
  async sendMessage(chatId, text) {
    const c = chats.find((x) => x.id === chatId);
    if (!c) throw new Error("chat_not_found");
    c.messages.push({ from: "me", text, time: "এখন" });
    c.last = text;
    c.when = "এখন";
    return wait(c, 80);
  },

  async listExchanges() {
    return wait(exchanges);
  },
  async advanceExchange(id) {
    const e = exchanges.find((x) => x.id === id);
    if (!e) throw new Error("exchange_not_found");
    const i = STEPS.indexOf(e.status);
    if (i >= 0 && i < STEPS.length - 1) e.status = STEPS[i + 1];
    return wait(e, 120);
  },

  async listNotifications() {
    return wait(notifications);
  },
  async markNotificationRead(id) {
    for (const n of notifications) if (id === "all" || n.id === id) n.unread = false;
    return wait(undefined, 60);
  },

  async getUser(username) {
    if (MOCK_USERS[username]) return wait(MOCK_USERS[username]);
    // Other people: build a plain profile from their posts (the API returns real ones).
    const theirs = posts.filter((p) => p.author.username === username);
    const a = theirs[0]?.author;
    if (!a) return wait(null);
    const given = theirs.filter((p) => p.kind === "offer" && p.status === "given").length;
    const profile: UserProfile = {
      username,
      name: a.name,
      verified: a.verified,
      trust: a.trust,
      area: theirs[0].area,
      district: theirs[0].district,
      joined: "২০২৬",
      given,
      received: 0,
      bio: "",
      badges: a.verified ? ["ইমেইল যাচাই"] : [],
      reviews: [],
      level: theirs.find((p) => p.edu)?.edu?.level,
      stats: {
        given,
        received: 0,
        booksGiven: 0,
        thanksReceived: 0,
        thanksWritten: 0,
        localHelped: 0,
        kgSaved: 0,
        responseMins: null,
        trust: a.trust,
      },
      thanks: [],
    };
    return wait(profile);
  },

  async getDashboard() {
    const me = useMe.getState();
    const ME = "rakib";
    const mine = (p: FeedPost) => p.author.username === ME;
    const fits = (p: FeedPost) =>
      (me.level && p.edu?.level === me.level) || me.interests.includes(p.category);
    const live = posts.filter((p) => p.status === "available" && !mine(p));
    const forYou = sortPosts(
      live.filter((p) => p.kind === "offer" && fits(p)),
      "near",
    ).slice(0, 6);
    const needsNearby = sortPosts(
      live.filter((p) => p.kind === "need" && p.distanceKm <= 10),
      "urgent",
    ).slice(0, 4);
    return wait({
      todo: {
        requestsToAnswer: exchanges.filter((e) => e.role === "giver" && e.status === "requested")
          .length,
        unreadMessages: chats.reduce((n, c) => n + c.unread, 0),
        activeExchanges: exchanges.filter(
          (e) => e.status === "accepted" || e.status === "scheduled",
        ).length,
        thanksToWrite: exchanges
          .filter(
            (e) => e.role === "receiver" && e.status === "completed" && !me.thanked.includes(e.id),
          )
          .map((e) => ({ exchangeId: e.id, item: e.title, to: e.other })),
      },
      forYou,
      needsNearby,
      recentThanks: MOCK_USERS[ME].thanks.slice(0, 2),
      community: {
        bn: "নতুন ক্লাস, পুরোনো বই — ঢাকার বই সংগ্রহ",
        en: "New class, old books — Dhaka book drive",
        current: 640,
        target: 1000,
        endsBn: "৩১ জানুয়ারি পর্যন্ত",
        endsEn: "until 31 January",
      },
      activeNearby: 38,
    } satisfies Dashboard);
  },

  async requestItem(postId) {
    const p = posts.find((x) => x.id === postId);
    if (!p) throw new Error("post_not_found");
    p.requests += 1;
    return wait(undefined, 200);
  },
  async reportPost() {
    return wait(undefined, 200);
  },
  async sendThanks(exchangeId, text) {
    const e = exchanges.find((x) => x.id === exchangeId);
    if (!e) throw new Error("exchange_not_found");
    useMe.getState().set({ thanked: [...useMe.getState().thanked, exchangeId] });
    // In the mock the giver's profile is the demo profile, so the note shows up there.
    MOCK_USERS.rakib.thanks.unshift({ by: "আপনি", item: e.title, text, when: "এইমাত্র" });
    return wait(undefined, 200);
  },

  async listCourierRequests() {
    return wait(courier);
  },
  async decideCourierRequest(id, decision) {
    const r = courier.find((x) => x.id === id);
    if (!r) throw new Error("courier_not_found");
    r.status = decision;
    r.tracking =
      decision === "confirmed" ? `SF${Math.floor(10000000 + Math.random() * 89999999)}` : undefined;
    return wait(r, 150);
  },

  async getAdConfig(placement, ctx = {}) {
    const st = store.adSettings;
    const ads: PublicAd[] = store.campaigns
      .filter((a) => adState(a) === "active" && a.placements.includes(placement))
      .filter(
        (a) => !ctx.district || a.districts.length === 0 || a.districts.includes(ctx.district),
      )
      .filter(
        (a) =>
          !ctx.category ||
          a.categories.length === 0 ||
          a.categories.includes(ctx.category as (typeof a.categories)[number]),
      )
      .filter((a) => safeAdUrl(a.url))
      // Weighted order: each ad repeated by its weight, so rotation favours heavier ads.
      .flatMap((a) => Array.from({ length: a.weight }, () => a))
      .sort(() => Math.random() - 0.5)
      .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
      .map(({ id, advertiser, headline, body, cta, url, image }) => ({
        id,
        advertiser,
        headline,
        body,
        cta,
        url,
        image,
      }));
    return wait(
      {
        enabled: st.adsEnabled,
        every: st.every,
        sessionCap: st.sessionCap,
        adx:
          st.adxEnabled && st.networkCode
            ? { networkCode: st.networkCode, unit: st.units[placement] }
            : null,
        priority: st.priority,
        ads,
      },
      120,
    );
  },
  async trackAd(id, event) {
    const a = store.campaigns.find((x) => x.id === id);
    if (a) a[event === "click" ? "clicks" : "impressions"] += 1;
  },

  async getCheckoutConfig() {
    const p = store.paymentSettings;
    return wait(
      { methods: p.methods, bkashNumber: p.bkashNumber, nagadNumber: p.nagadNumber },
      120,
    );
  },
  async submitCourierPayment(input) {
    const used = input.trxId && store.payments.some((p) => p.trxId === input.trxId);
    const payment = {
      id: `pay${Date.now()}`,
      ...input,
      status: input.method === "cod" ? ("cod_due" as const) : ("pending" as const),
      flags: used ? ["এই TrxID আরেকটি পেমেন্টে আগেই দেওয়া হয়েছে"] : [],
      created: "এইমাত্র",
    };
    store.payments.unshift(payment);
    return wait(payment, 200);
  },
};
