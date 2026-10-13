import { useLang } from "@/features/feed/i18n";
import { KG_PER_ITEM } from "@/features/feed/gamify";
import type { MockExchange, MockUser } from "@/features/feed/mock";
import { useMe } from "@/features/feed/me";
import type { CategoryId, CourierRequestItem, FeedPost } from "@/features/feed/types";
import { FunctionError, callFunction, postImageUrl, supabase } from "@/services/supabase";
import { AuthService } from "@/features/auth/auth.service";
import { sortPosts } from "./filtering";
import { clock, monthYear, relTime } from "./relTime";
import type {
  AdConfig,
  AppNotification,
  Chat,
  Dashboard,
  DataSource,
  DonationMapData,
  Exchange,
  FeedFilters,
  ThanksNote,
} from "./types";

// The real data source: the browser talks to Supabase directly (Firebase token + row-level security) and to Edge
// Functions for the few things that need a secret. See supabase/migrations for every rule enforced in the database.

const sb = supabase;
const fail = (e: { message: string } | null): never => {
  throw new Error(e?.message ?? "request_failed");
};

// ── who am I ──
let me: { uid: string; id: Promise<string> } | undefined;
async function myId(): Promise<string> {
  const uid = await AuthService.currentUid();
  if (!uid) throw new Error("not_signed_in");
  if (me?.uid !== uid) {
    me = {
      uid,
      id: (async () => {
        const { data, error } = await sb().rpc("my_pid");
        if (error || !data) return fail(error ?? { message: "no_profile" });
        return data as string;
      })(),
    };
    me.id.catch(() => {
      me = undefined;
    });
  }
  return me.id;
}

// ── feed ──
interface FeedRow {
  id: string;
  kind: "offer" | "need";
  title: string;
  description: string;
  category: CategoryId;
  condition: "new" | "good" | "used";
  area: string;
  district: string;
  images: string[];
  edu_level: NonNullable<FeedPost["edu"]>["level"] | null;
  edu_detail: string | null;
  delivery: FeedPost["delivery"];
  urgency: FeedPost["urgency"] | null;
  qty: number | null;
  status: "available" | "reserved" | "given" | "archived";
  created_at: string;
  author_name: string;
  author_username: string | null;
  author_verified: boolean;
  author_trust: number;
  requests: number;
  distance_km: number;
  mine: boolean;
}

const toPost = (r: FeedRow): FeedPost => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  description: r.description,
  category: r.category,
  condition: r.condition,
  area: r.area,
  district: r.district,
  distanceKm: r.distance_km,
  author: {
    name: r.author_name,
    username: r.author_username ?? "",
    verified: r.author_verified,
    trust: r.author_trust,
  },
  images: r.images.map(postImageUrl),
  postedAt: relTime(r.created_at),
  hoursAgo: Math.max(0, Math.floor((Date.now() - Date.parse(r.created_at)) / 3_600_000)),
  requests: r.requests,
  edu: r.edu_level ? { level: r.edu_level, detail: r.edu_detail ?? undefined } : undefined,
  delivery: r.delivery,
  urgency: r.urgency ?? undefined,
  qty: r.qty ?? undefined,
  status: r.status === "archived" ? "given" : r.status,
  mine: r.mine,
});

/** Strips characters that have a meaning inside a PostgREST `or(...)` filter, so search text can't alter the query. */
const cleanSearch = (s: string) => s.replace(/[,()%*\\:"']/g, " ").trim().slice(0, 60);

const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

async function listFeed(f: FeedFilters): Promise<FeedPost[]> {
  let q = sb().from("feed_posts").select("*");
  if (f.kind !== "all") q = q.eq("kind", f.kind);
  if (f.category && f.category !== "all") q = q.eq("category", f.category);
  if (f.level && f.level !== "all") q = q.eq("edu_level", f.level);
  if (f.conditions?.length) q = q.in("condition", f.conditions);
  if (f.delivery && f.delivery !== "any") q = q.contains("delivery", [f.delivery]);
  if (f.within === "24h") q = q.gte("created_at", hoursAgoIso(24));
  if (f.within === "7d") q = q.gte("created_at", hoursAgoIso(24 * 7));
  if (f.verifiedOnly) q = q.eq("author_verified", true);
  if (f.photoOnly) q = q.neq("images", "{}");
  if (f.urgentOnly) q = q.eq("urgency", "urgent");
  if (!f.showGiven) q = q.neq("status", "given");
  if (f.scope === "area") q = q.lte("distance_km", 5);
  if (f.scope === "district") q = q.lte("distance_km", 15);
  const text = cleanSearch(f.q ?? "");
  if (text) q = q.or(`title.ilike.%${text}%,description.ilike.%${text}%,edu_detail.ilike.%${text}%`);

  const sort = f.sort ?? "near";
  q =
    sort === "popular"
      ? q.order("requests", { ascending: false }).order("created_at", { ascending: false })
      : sort === "new" || sort === "urgent"
        ? q.order("created_at", { ascending: false })
        : q.order("distance_km", { ascending: true }).order("created_at", { ascending: false });

  const { data, error } = await q.limit(100);
  if (error) fail(error);
  const posts = (data as FeedRow[]).map(toPost);
  return sort === "urgent" ? sortPosts(posts, "urgent") : posts;
}

async function getPost(id: string): Promise<FeedPost | null> {
  const { data, error } = await sb().from("feed_posts").select("*").eq("id", id).maybeSingle();
  if (error) fail(error);
  return data ? toPost(data as FeedRow) : null;
}

// ── chat ──
async function loadChats(): Promise<Chat[]> {
  const mine = await myId();
  const { data: chats, error } = await sb()
    .from("my_chats")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) fail(error);
  const rows = (chats ?? []) as {
    id: string;
    post_id: string | null;
    post_title: string | null;
    post_kind: "offer" | "need" | null;
    other_name: string | null;
    other_verified: boolean | null;
    last_body: string | null;
    last_message_at: string;
    unread: number;
  }[];
  const ids = rows.map((c) => c.id);
  const { data: msgs, error: mErr } = ids.length
    ? await sb()
        .from("messages")
        .select("conversation_id, sender_id, kind, body, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true })
    : { data: [], error: null };
  if (mErr) fail(mErr);
  const byChat = new Map<string, Chat["messages"]>();
  for (const m of (msgs ?? []) as { conversation_id: string; sender_id: string | null; kind: string; body: string; created_at: string }[]) {
    const list = byChat.get(m.conversation_id) ?? [];
    list.push({
      from: m.kind === "system" ? "system" : m.sender_id === mine ? "me" : "them",
      text: m.body,
      time: clock(m.created_at),
    });
    byChat.set(m.conversation_id, list);
  }
  return rows.map((c) => ({
    id: c.id,
    postId: c.post_id ?? undefined,
    with: c.other_name ?? "",
    verified: !!c.other_verified,
    postTitle: c.post_title ?? "",
    postKind: c.post_kind ?? "offer",
    last: c.last_body ?? "",
    when: relTime(c.last_message_at),
    unread: c.unread,
    messages: byChat.get(c.id) ?? [],
  }));
}

// ── exchanges ──
interface ExchangeRow {
  id: string;
  post_id: string;
  giver_id: string;
  receiver_id: string;
  status: Exchange["status"];
  via: Exchange["via"];
  conversation_id: string | null;
  courier_ok_giver: boolean;
  courier_ok_receiver: boolean;
  updated_at: string;
}

async function loadExchanges(): Promise<Exchange[]> {
  const mine = await myId();
  const { data, error } = await sb().from("exchanges").select("*").order("updated_at", { ascending: false });
  if (error) fail(error);
  const rows = (data ?? []) as ExchangeRow[];
  if (rows.length === 0) return [];
  const postIds = [...new Set(rows.map((r) => r.post_id))];
  const otherIds = [...new Set(rows.map((r) => (r.giver_id === mine ? r.receiver_id : r.giver_id)))];
  const [posts, people] = await Promise.all([
    sb().from("posts").select("id, title, category").in("id", postIds),
    sb().from("public_profiles").select("id, display_name").in("id", otherIds),
  ]);
  const title = new Map((posts.data ?? []).map((p) => [p.id as string, p as { title: string; category: CategoryId }]));
  const name = new Map((people.data ?? []).map((p) => [p.id as string, p.display_name as string]));
  return rows.map<MockExchange>((r) => {
    const giver = r.giver_id === mine;
    const p = title.get(r.post_id);
    return {
      id: r.id,
      postId: r.post_id,
      chatId: r.conversation_id ?? undefined,
      title: p?.title ?? "",
      category: p?.category ?? "other",
      role: giver ? "giver" : "receiver",
      other: name.get(giver ? r.receiver_id : r.giver_id) ?? "",
      status: r.status,
      via: r.via,
      updated: relTime(r.updated_at),
      courierOk: { giver: r.courier_ok_giver, receiver: r.courier_ok_receiver },
    };
  });
}

const pickText = (bn: string, en: string) => (useLang.getState().lang === "en" ? en : bn);

// ── people ──
interface PublicProfileRow {
  id: string;
  username: string | null;
  display_name: string;
  bio: string;
  district: string | null;
  upazila: string | null;
  area: string | null;
  created_at: string;
  edu_level: MockUser["level"] | null;
  institution: string | null;
  verified: boolean;
  given: number;
  received: number;
  thanks_received: number;
  thanks_written: number;
  given_by_category: Partial<Record<CategoryId, number>>;
  trust: number;
}

async function thanksFor(personId: string, limit: number): Promise<ThanksNote[]> {
  const { data, error } = await sb()
    .from("thanks")
    .select("body, item, created_at, from_id")
    .eq("to_id", personId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail(error);
  const rows = (data ?? []) as { body: string; item: string; created_at: string; from_id: string }[];
  if (rows.length === 0) return [];
  const { data: people } = await sb()
    .from("public_profiles")
    .select("id, display_name")
    .in("id", [...new Set(rows.map((r) => r.from_id))]);
  const name = new Map((people ?? []).map((p) => [p.id as string, p.display_name as string]));
  return rows.map((r) => ({
    by: name.get(r.from_id) ?? "",
    item: r.item,
    text: r.body,
    when: relTime(r.created_at),
  }));
}

export const supabaseSource: DataSource = {
  listFeed,
  getPost,

  async publishPost(input) {
    const uid = await AuthService.currentUid();
    const mine = await myId();
    if (!uid) throw new Error("not_signed_in");
    const { data: profile, error: pErr } = await sb()
      .from("profiles")
      .select("district, upazila, area")
      .eq("id", mine)
      .single();
    if (pErr) fail(pErr);

    // Photos go to the person's own folder; the bucket policy refuses anything else.
    const uploaded: string[] = [];
    try {
      for (const file of input.photos.slice(0, 5)) {
        const path = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb()
          .storage.from("post-images")
          .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
        if (error) fail(error);
        uploaded.push(path);
      }
      const { data, error } = await sb()
        .from("posts")
        .insert({
          owner_id: mine,
          kind: input.kind,
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category,
          condition: input.condition,
          // Where the post shows up comes from the profile, so nobody can post "from" another district.
          district: profile?.district,
          upazila: profile?.upazila,
          area: profile?.area ?? "",
          images: uploaded,
          edu_level: input.edu?.level ?? null,
          edu_detail: input.edu?.detail ?? null,
          delivery: input.delivery,
          urgency: input.kind === "need" ? (input.urgency ?? null) : null,
          qty: input.qty ?? null,
        })
        .select("id")
        .single();
      if (error) fail(error);
      const post = await getPost((data as { id: string }).id);
      if (!post) throw new Error("publish_failed");
      return post;
    } catch (e) {
      if (uploaded.length) await sb().storage.from("post-images").remove(uploaded);
      throw e;
    }
  },

  async aiDraft(photos) {
    const toBase64 = (f: File) =>
      new Promise<{ mime: string; data: string }>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve({ mime: f.type || "image/jpeg", data: String(r.result).split(",")[1] ?? "" });
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
    const images = await Promise.all(photos.slice(0, 3).map(toBase64));
    try {
      return await callFunction("ai-draft", { images });
    } catch (e) {
      // "ai_limit" (20 a day) and "ai_busy" (free quota) both mean: write it yourself.
      throw new Error(e instanceof FunctionError ? e.code : "network");
    }
  },

  listChats: loadChats,

  async sendMessage(chatId, text) {
    const { error } = await sb()
      .from("messages")
      .insert({ conversation_id: chatId, sender_id: await myId(), body: text.slice(0, 1000) });
    if (error) fail(error);
    const chat = (await loadChats()).find((c) => c.id === chatId);
    if (!chat) throw new Error("chat_not_found");
    return chat;
  },

  async markChatRead(chatId) {
    const { error } = await sb().rpc("mark_conversation_read", { p_conversation: chatId });
    if (error) fail(error);
  },

  listExchanges: loadExchanges,

  async advanceExchange(id) {
    const current = (await loadExchanges()).find((e) => e.id === id);
    if (!current) throw new Error("exchange_not_found");
    const fn =
      current.status === "requested" ? "accept_exchange" : current.status === "accepted" ? "schedule_exchange" : null;
    if (fn) {
      const { error } = await sb().rpc(fn, { p_id: id });
      if (error) fail(error);
    }
    const next = (await loadExchanges()).find((e) => e.id === id);
    if (!next) throw new Error("exchange_not_found");
    return next;
  },

  async getHandoverCode(exchangeId) {
    const { data, error } = await sb().rpc("get_handover_code", { p_id: exchangeId });
    if (error) fail(error);
    return data as string;
  },

  async confirmHandover(exchangeId, code) {
    const { data, error } = await sb().rpc("confirm_handover", { p_id: exchangeId, p_code: code });
    if (error) fail(error);
    if (data !== "ok") throw new Error(data === "locked" ? "locked" : "wrong_code");
    const done = (await loadExchanges()).find((e) => e.id === exchangeId);
    if (!done) throw new Error("exchange_not_found");
    return done;
  },

  async listNotifications() {
    const { data, error } = await sb()
      .from("notifications")
      .select("id, kind, text_bn, text_en, route, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) fail(error);
    return (data ?? []).map<AppNotification>((n) => ({
      id: n.id,
      kind: n.kind,
      text: pickText(n.text_bn, n.text_en),
      when: relTime(n.created_at),
      unread: !n.read_at,
      href: n.route,
    }));
  },

  async markNotificationRead(id) {
    let q = sb().from("notifications").update({ read_at: new Date().toISOString() });
    q = id === "all" ? q.is("read_at", null) : q.eq("id", id);
    const { error } = await q;
    if (error) fail(error);
  },

  async getUser(username) {
    const { data, error } = await sb().from("public_profiles").select("*").eq("username", username).maybeSingle();
    if (error) fail(error);
    if (!data) return null;
    const u = data as PublicProfileRow;
    const kg = Object.entries(u.given_by_category).reduce(
      (sum, [cat, n]) => sum + (KG_PER_ITEM[cat as CategoryId] ?? 1) * (n ?? 0),
      0,
    );
    return {
      username: u.username ?? username,
      name: u.display_name,
      verified: u.verified,
      trust: u.trust,
      area: u.area ?? "",
      district: u.district ?? "",
      joined: monthYear(u.created_at),
      given: u.given,
      received: u.received,
      bio: u.bio,
      badges: u.verified ? ["ইমেইল যাচাই", "ঠিকানা যাচাই", "ফোন যাচাই"] : ["ইমেইল যাচাই"],
      reviews: [],
      stats: {
        given: u.given,
        received: u.received,
        booksGiven: u.given_by_category.books ?? 0,
        thanksReceived: u.thanks_received,
        thanksWritten: u.thanks_written,
        localHelped: 0,
        kgSaved: kg,
        responseMins: null,
        trust: u.trust,
      },
      thanks: await thanksFor(u.id, 5),
      level: u.edu_level ?? undefined,
      institution: u.institution ?? undefined,
    } satisfies MockUser;
  },

  async getDashboard() {
    const mine = await myId();
    const interests = useMe.getState();
    const [counts, offers, needs, thanks] = await Promise.all([
      sb().rpc("my_counts"),
      listFeed({ kind: "offer", category: "all", scope: "country", sort: "near" }),
      listFeed({ kind: "need", category: "all", scope: "district", sort: "urgent" }),
      thanksFor(mine, 3),
    ]);
    if (counts.error) fail(counts.error);
    const c = counts.data as {
      requestsToAnswer: number;
      unreadMessages: number;
      activeExchanges: number;
      thanksToWrite: { exchangeId: string; item: string; to: string }[];
      activeNearby: number;
    };
    const fits = (p: FeedPost) =>
      (interests.level && p.edu?.level === interests.level) || interests.interests.includes(p.category);
    const dash: Dashboard = {
      todo: {
        requestsToAnswer: c.requestsToAnswer,
        unreadMessages: c.unreadMessages,
        activeExchanges: c.activeExchanges,
        thanksToWrite: c.thanksToWrite,
      },
      forYou: offers.filter((p) => p.status === "available" && !p.mine && fits(p)).slice(0, 6),
      needsNearby: needs.filter((p) => p.status === "available" && !p.mine).slice(0, 4),
      recentThanks: thanks,
      community: null, // a shared goal needs real data; none is faked
      activeNearby: c.activeNearby,
    };
    return dash;
  },

  async getDonationMap() {
    const { data, error } = await sb().rpc("donation_map");
    if (error) fail(error);
    const m = data as {
      hubs: {
        district: string;
        donors: number;
        items: number;
        fresh: boolean;
        recent: { name: string; item: string; at: string }[];
      }[];
      givenToday: number;
      givenThisMonth: number;
      districtsActive: number;
    };
    const out: DonationMapData = {
      givenToday: m.givenToday,
      givenThisMonth: m.givenThisMonth,
      districtsActive: m.districtsActive,
      hubs: m.hubs.map((h) => ({
        ...h,
        recent: h.recent.map((r) => ({
          name: r.name,
          item: r.item,
          whenBn: relTimeIn(r.at, "bn"),
          whenEn: relTimeIn(r.at, "en"),
        })),
      })),
    };
    return out;
  },

  async requestItem(postId, input) {
    const { error } = await sb().rpc("request_post", { p_post: postId, p_message: input.message, p_via: input.via });
    if (error) fail(error);
  },

  async reportPost(postId, reason, details) {
    const { error } = await sb().rpc("report_post", { p_post: postId, p_reason: reason, p_details: details });
    if (error) fail(error);
  },

  async sendThanks(exchangeId, text) {
    const { error } = await sb().rpc("send_thanks", { p_id: exchangeId, p_text: text });
    if (error) fail(error);
  },

  async agreeCourier(exchangeId) {
    const { data, error } = await sb().rpc("agree_courier", { p_id: exchangeId });
    if (error) fail(error);
    return data === "sent" ? "sent" : "waiting";
  },

  async listCourierRequests() {
    const { data, error } = await sb().from("courier_requests").select("*").order("created_at", { ascending: false });
    if (error) fail(error);
    return (data ?? []).map<CourierRequestItem>((r) => ({
      id: r.id,
      exchangeId: r.exchange_id,
      item: r.item,
      category: r.category,
      giver: { name: r.giver_name, phone: r.giver_phone ?? "", address: r.giver_address },
      receiver: { name: r.receiver_name, phone: r.receiver_phone ?? "", address: r.receiver_address },
      weightKg: Number(r.weight_kg),
      charge: r.charge,
      status: r.status,
      tracking: r.tracking_code ?? undefined,
      createdAt: relTime(r.created_at),
    }));
  },

  async decideCourierRequest(id, decision) {
    try {
      await callFunction("admin-courier", { id, decision });
    } catch (e) {
      throw new Error(e instanceof FunctionError ? e.code : "network");
    }
    const row = (await supabaseSource.listCourierRequests()).find((r) => r.id === id);
    if (!row) throw new Error("not_found");
    return row;
  },

  // Direct ads and the ad network are configured by an admin in `platform_settings` (key "ads").
  async getAdConfig() {
    const { data } = await sb().from("platform_settings").select("value").eq("key", "ads").maybeSingle();
    const v = (data?.value ?? {}) as Partial<AdConfig>;
    return {
      enabled: v.enabled ?? true,
      every: v.every ?? 6,
      sessionCap: v.sessionCap ?? 6,
      adx: v.adx ?? null,
      priority: v.priority ?? "direct_first",
      ads: v.ads ?? [],
    };
  },

  async trackAd() {
    // Impression/click counting is not stored yet; ad-network reports are the source of truth for now.
  },

  async getCheckoutConfig() {
    // Courier fees are paid by the receiver in cash on delivery; mobile-wallet payments are not enabled.
    return { methods: { cod: true, bkash: false, nagad: false }, bkashNumber: "", nagadNumber: "" };
  },

  async submitCourierPayment() {
    throw new Error("Courier fees are paid in cash on delivery");
  },
};

function relTimeIn(iso: string, lang: "bn" | "en"): string {
  const prev = useLang.getState().lang;
  useLang.setState({ lang });
  try {
    return relTime(iso);
  } finally {
    useLang.setState({ lang: prev });
  }
}
