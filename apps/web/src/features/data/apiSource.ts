import { useLang } from "@/features/feed/i18n";
import { KG_PER_ITEM } from "@/features/feed/gamify";
import type { CategoryId, FeedPost } from "@/features/feed/types";
import { apiClient, isAxiosError } from "@/services/api";
import { clockTime, hoursSince, longDate, monthYear, relTime } from "./time";
import type {
  AppNotification,
  Chat,
  CourierRequest,
  Dashboard,
  DataSource,
  DonationMapData,
  Exchange,
  FeedFilters,
  SearchResult,
  UserProfile,
} from "./types";

// The real backend (apps/api). Responses are { success, data }; errors are
// { success: false, code } and surface here as Error(code) — e.g. "wrong_code",
// "ai_limit" — so pages can react to specific cases.

async function call<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  try {
    return (await p).data.data;
  } catch (e) {
    if (isAxiosError(e)) {
      if (!e.response) throw new Error("network");
      throw new Error((e.response.data as { code?: string })?.code ?? `http_${e.response.status}`);
    }
    throw e;
  }
}

const get = <T>(url: string, params?: object) => call<T>(apiClient.get(url, { params }));
const post = <T>(url: string, body?: unknown) => call<T>(apiClient.post(url, body));
const tr = (bn: string, en: string) => (useLang.getState().lang === "bn" ? bn : en);

// --- shapes the API sends ----------------------------------------------------

type ApiPost = Omit<FeedPost, "postedAt" | "hoursAgo"> & { createdAt: string; mine?: boolean };

const toPost = (p: ApiPost): FeedPost => ({
  ...p,
  postedAt: relTime(p.createdAt),
  hoursAgo: hoursSince(p.createdAt),
});

interface ApiMessage {
  from: "me" | "them" | "system";
  type: "text" | "image" | "system";
  text: string;
  at: string;
}

const SYSTEM: Record<string, () => string> = {
  request_sent: () => tr("এই পোস্টে রিকোয়েস্ট পাঠানো হয়েছে।", "A request was sent on this post."),
};
const messageText = (m: ApiMessage) =>
  m.type === "system" ? (SYSTEM[m.text]?.() ?? m.text) : m.text;

interface ApiChat {
  id: string;
  with: string;
  verified: boolean;
  postTitle: string;
  postKind: "offer" | "need";
  last: ApiMessage | null;
  lastAt: string;
  unread: number;
  messages: ApiMessage[];
}

const toChat = (c: ApiChat): Chat => ({
  id: c.id,
  with: c.with,
  verified: c.verified,
  postTitle: c.postTitle,
  postKind: c.postKind,
  last: c.last ? messageText(c.last) : "",
  when: clockTime(c.lastAt),
  unread: c.unread,
  messages: c.messages.map((m) => ({ from: m.from, text: messageText(m), time: clockTime(m.at) })),
});

type ApiExchange = Omit<Exchange, "updated"> & { updatedAt: string };
const toExchange = (e: ApiExchange): Exchange => ({ ...e, updated: relTime(e.updatedAt) });

const BADGES: Record<string, [string, string]> = {
  email: ["ইমেইল যাচাই", "Email verified"],
  phone: ["ফোন যাচাই", "Phone verified"],
  address: ["ঠিকানা যাচাই", "Address verified"],
};

interface ApiUser {
  username: string;
  name: string;
  verified: boolean;
  trust: number;
  area: string;
  district: string;
  joinedAt: string;
  bio: string;
  badges: string[];
  level?: UserProfile["level"];
  institution?: string;
  stats: Omit<UserProfile["stats"], "kgSaved" | "trust"> & {
    givenByCategory: Record<string, number>;
  };
  reviews: { by: string; stars: number; text: string; at: string }[];
  thanks: { by: string; item: string; text: string; at: string }[];
}

const toUser = (u: ApiUser): UserProfile => {
  const { givenByCategory, ...stats } = u.stats;
  const kgSaved = Object.entries(givenByCategory).reduce(
    (kg, [cat, count]) => kg + (KG_PER_ITEM[cat as CategoryId] ?? 1) * count,
    0,
  );
  return {
    username: u.username,
    name: u.name,
    verified: u.verified,
    trust: u.trust,
    area: u.area,
    district: u.district,
    joined: monthYear(u.joinedAt),
    given: stats.given,
    received: stats.received,
    bio: u.bio,
    badges: u.badges.map((b) => (BADGES[b] ? tr(...BADGES[b]) : b)),
    level: u.level,
    institution: u.institution,
    stats: { ...stats, kgSaved, trust: u.trust },
    reviews: u.reviews.map((r) => ({
      by: r.by,
      stars: r.stars,
      text: r.text,
      when: relTime(r.at),
    })),
    thanks: u.thanks.map((t) => ({ by: t.by, item: t.item, text: t.text, when: relTime(t.at) })),
  };
};

type ApiCourierRequest = Omit<CourierRequest, "createdAt"> & { createdAt: string };

// --- the source ----------------------------------------------------------------

const feedParams = (f: FeedFilters) => ({
  kind: f.kind,
  category: f.category,
  scope: f.scope,
  q: f.q || undefined,
  level: f.level,
  conditions: f.conditions?.length ? f.conditions.join(",") : undefined,
  delivery: f.delivery,
  within: f.within,
  verifiedOnly: f.verifiedOnly || undefined,
  photoOnly: f.photoOnly || undefined,
  urgentOnly: f.urgentOnly || undefined,
  showGiven: f.showGiven || undefined,
  sort: f.sort,
  user: f.user,
});

export const apiSource: DataSource = {
  async listFeed(f) {
    return (await get<ApiPost[]>("/feed", feedParams(f))).map(toPost);
  },
  async search(f) {
    const r = await get<{ posts: ApiPost[]; related: ApiPost[]; ai: SearchResult["ai"] }>(
      "/search",
      feedParams(f),
    );
    return { posts: r.posts.map(toPost), related: r.related.map(toPost), ai: r.ai };
  },
  async listMyPosts() {
    return (await get<ApiPost[]>("/posts/mine")).map(toPost);
  },
  async getPost(id) {
    try {
      return toPost(await get<ApiPost>(`/posts/${id}`));
    } catch (e) {
      if ((e as Error).message === "post_not_found") return null;
      throw e;
    }
  },
  async publishPost(input) {
    const form = new FormData();
    const { photos, ...data } = input;
    form.append("data", JSON.stringify(data));
    for (const p of photos) form.append("photos", p, p.name || "photo.jpg");
    return toPost(await call<ApiPost>(apiClient.post("/posts", form, { timeout: 60_000 })));
  },
  async setMyPostStatus(id, status) {
    await call(apiClient.patch(`/posts/${id}`, { status }));
  },
  async aiDraft(photos) {
    const form = new FormData();
    for (const p of photos) form.append("photos", p, p.name || "photo.jpg");
    return call(apiClient.post("/ai/draft", form, { timeout: 40_000 }));
  },

  async listChats() {
    return (await get<ApiChat[]>("/chat")).map(toChat);
  },
  async sendMessage(chatId, text) {
    await post(`/chat/${chatId}/messages`, { text });
    const chat = (await get<ApiChat[]>("/chat")).find((c) => c.id === chatId);
    if (!chat) throw new Error("chat_not_found");
    return toChat(chat);
  },
  async markChatRead(chatId) {
    await post(`/chat/${chatId}/read`);
  },

  async listExchanges() {
    return (await get<ApiExchange[]>("/exchanges")).map(toExchange);
  },
  async advanceExchange(id) {
    return toExchange(await post<ApiExchange>(`/exchanges/${id}/advance`));
  },
  async getHandoverCode(exchangeId) {
    return (await get<{ code: string }>(`/exchanges/${exchangeId}/handover-code`)).code;
  },
  async confirmHandover(exchangeId, code) {
    return toExchange(await post<ApiExchange>(`/exchanges/${exchangeId}/handover`, { code }));
  },

  async listNotifications() {
    const rows = await get<(Omit<AppNotification, "when"> & { at: string })[]>("/notifications");
    return rows.map(({ at, ...n }) => ({ ...n, when: relTime(at) }));
  },
  async markNotificationRead(id) {
    await post("/notifications/read", { id });
  },

  async getUser(username) {
    try {
      return toUser(await get<ApiUser>(`/users/${encodeURIComponent(username)}`));
    } catch (e) {
      if ((e as Error).message === "user_not_found") return null;
      throw e;
    }
  },
  async getDashboard() {
    const d = await get<
      Omit<Dashboard, "forYou" | "needsNearby" | "recentThanks"> & {
        forYou: ApiPost[];
        needsNearby: ApiPost[];
        recentThanks: { by: string; item: string; text: string; at: string }[];
      }
    >("/me/dashboard");
    return {
      ...d,
      forYou: d.forYou.map(toPost),
      needsNearby: d.needsNearby.map(toPost),
      recentThanks: d.recentThanks.map(({ at, ...t }) => ({ ...t, when: relTime(at) })),
    };
  },
  async getDonationMap() {
    type Hub = Omit<DonationMapData["hubs"][number], "recent"> & {
      recent: { name: string; item: string; at: string }[];
    };
    const d = await get<Omit<DonationMapData, "hubs"> & { hubs: Hub[] }>("/stats/donation-map");
    return {
      ...d,
      hubs: d.hubs.map((h) => ({
        ...h,
        recent: h.recent.map((r) => ({
          name: r.name,
          item: r.item,
          whenBn: relTime(r.at, "bn"),
          whenEn: relTime(r.at, "en"),
        })),
      })),
    };
  },
  async requestItem(postId, input) {
    return post(`/posts/${postId}/requests`, input);
  },
  async reportPost(postId, reason, details) {
    await post("/reports", { targetType: "post", targetId: postId, reason, details });
  },
  async sendThanks(exchangeId, text, stars) {
    await post(`/exchanges/${exchangeId}/thanks`, { text, stars });
  },

  async getCourier(exchangeId) {
    return get(`/courier/${exchangeId}`);
  },
  async agreeCourier(exchangeId, address, weightKg) {
    await post(`/courier/${exchangeId}/agree`, { ...address, ...(weightKg ? { weightKg } : {}) });
  },
  async requestCourier(exchangeId, payment) {
    await post(`/courier/${exchangeId}/request`, payment);
  },

  async listCourierRequests() {
    const rows = await get<ApiCourierRequest[]>("/admin/courier-requests");
    return rows.map((r) => ({ ...r, createdAt: longDate(r.createdAt) }));
  },
  async decideCourierRequest(id, decision) {
    const r = await post<ApiCourierRequest>(`/admin/courier-requests/${id}/decide`, { decision });
    return { ...r, createdAt: longDate(r.createdAt) };
  },

  async getAdConfig(placement, ctx = {}) {
    return get("/ads", { placement, ...ctx });
  },
  async trackAd(id, event) {
    await post(`/ads/${id}/events`, { type: event, session: adSession() });
  },

  async getPage(slug) {
    try {
      return await get(`/pages/${slug}`);
    } catch (e) {
      if ((e as Error).message === "page_not_found") return null;
      throw e;
    }
  },
};

/** One id per browser tab, so the server counts an ad impression once per visit. */
function adSession(): string {
  try {
    let s = sessionStorage.getItem("reusedo-ad-session");
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem("reusedo-ad-session", s);
    }
    return s;
  } catch {
    return "no-storage-session";
  }
}
