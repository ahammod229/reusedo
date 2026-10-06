import {
  MOCK_CHATS,
  MOCK_COURIER,
  MOCK_EXCHANGES,
  MOCK_NOTIFICATIONS,
  MOCK_POSTS,
  MOCK_USERS,
} from "@/features/feed/mock";
import type { FeedPost } from "@/features/feed/types";
import type { DataSource, ExchangeStatus } from "./types";

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
  async listFeed({ kind, category, scope, q }) {
    const out = posts
      .filter((p) => kind === "all" || p.kind === kind)
      .filter((p) => category === "all" || p.category === category)
      .filter(
        (p) => !q || `${p.title} ${p.description}`.toLowerCase().includes(q.trim().toLowerCase()),
      )
      .filter((p) =>
        scope === "area" ? p.distanceKm <= 5 : scope === "district" ? p.district === "ঢাকা" : true,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
    return wait(out);
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
      author: { name: "আমি", verified: true, trust: 80 },
      images: input.photos.map((f) => URL.createObjectURL(f)),
      postedAt: "এইমাত্র",
      requests: 0,
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
    return wait(MOCK_USERS[username] ?? MOCK_USERS.rakib);
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
};
