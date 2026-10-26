import type {
  ExchangeStatus,
  MockConversation,
  MockExchange,
  MockNotification,
  MockUser,
} from "@/features/feed/mock";
import type {
  CourierRequestItem,
  Delivery,
  EduLevel,
  FeedPost,
  PostKind,
  Urgency,
} from "@/features/feed/types";
import type { AdPlacement, Payment, PaymentMethod } from "./platformStore";

export type { ExchangeStatus };
export type Chat = MockConversation;
export type ChatMessage = MockConversation["messages"][number];
export type Exchange = MockExchange;
export type AppNotification = MockNotification;
export type UserProfile = MockUser;
export type CourierRequest = CourierRequestItem;

/** What a visitor's browser gets for one ad slot — no stats or targeting rules. */
export interface PublicAd {
  id: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  url: string;
  image?: string;
}

export interface AdConfig {
  enabled: boolean;
  every: number;
  sessionCap: number;
  /** Set when Google Ad Manager should fill slots. */
  adx: { networkCode: string; unit: string } | null;
  priority: "direct_first" | "adx_first" | "mix";
  ads: PublicAd[];
}

export interface CheckoutConfig {
  methods: Record<PaymentMethod, boolean>;
  bkashNumber: string;
  nagadNumber: string;
}

/** One courier delivery as both sides see it (each sees only their own full address). */
export interface CourierView {
  exchangeId: string;
  item: string;
  category: import("@/features/feed/types").CategoryId;
  role: "giver" | "receiver";
  giverAgreed: boolean;
  receiverAgreed: boolean;
  myAddress: CourierAddress | null;
  pickupArea: string | null;
  dropoffArea: string | null;
  weightKg: number | null;
  zone: "insideDhaka" | "dhakaSuburb" | "outsideDhaka" | null;
  /** From the admin's rate card, computed on the server. */
  charge: number | null;
  request: {
    id: string;
    status: "pending" | "confirmed" | "rejected";
    tracking: string | null;
    delivery:
      | "in_review"
      | "picked_up"
      | "in_transit"
      | "delivered"
      | "returned"
      | "cancelled"
      | null;
    charge: number;
    payment: { method: PaymentMethod; status: Payment["status"] } | null;
  } | null;
  checkout: CheckoutConfig;
}

export interface CourierAddress {
  name: string;
  phone: string;
  district: string;
  upazila: string;
  area: string;
  line: string;
}

export type CourierPaymentInput =
  | { method: "cod" }
  | { method: "bkash" | "nagad"; trxId: string; senderNumber: string };

export type SortBy = "near" | "new" | "urgent" | "popular";

export interface FeedFilters {
  kind: PostKind | "all";
  category: string;
  scope: "area" | "district" | "country";
  /** Free-text search over title, description and study detail. */
  q?: string;
  level?: EduLevel | "all";
  conditions?: FeedPost["condition"][];
  delivery?: Delivery | "any";
  within?: "24h" | "7d" | "any";
  verifiedOnly?: boolean;
  photoOnly?: boolean;
  urgentOnly?: boolean;
  /** Given-away posts are hidden unless asked for. */
  showGiven?: boolean;
  sort?: SortBy;
  /** Only this person's posts (profile page). */
  user?: string;
}

export interface AiDraft {
  title: string;
  description: string;
  category: FeedPost["category"];
  condition: FeedPost["condition"];
}

export interface NewPostInput extends AiDraft {
  kind: PostKind;
  /** Image files already compressed on the client. */
  photos: File[];
  edu?: FeedPost["edu"];
  delivery: Delivery[];
  urgency?: Urgency;
  qty?: number;
}

export interface ThanksNote {
  by: string;
  item: string;
  text: string;
  when: string;
}

export interface Dashboard {
  todo: {
    requestsToAnswer: number;
    unreadMessages: number;
    activeExchanges: number;
    /** Completed exchanges where I received and haven't said thanks yet. */
    thanksToWrite: { exchangeId: string; item: string; to: string }[];
  };
  /** Offers that fit my study level / interests, nearest first. */
  forYou: FeedPost[];
  /** Needs near me — people I could help today. */
  needsNearby: FeedPost[];
  recentThanks: ThanksNote[];
  /** A shared goal, e.g. a new-school-year book drive. Real counts from the API only. */
  community: {
    bn: string;
    en: string;
    current: number;
    target: number;
    endsBn: string;
    endsEn: string;
  } | null;
  /** People active in my district this week (real count from the API). */
  activeNearby: number;
}

export type { Delivery };
export type ReportReason = "spam" | "fraud" | "fake_item" | "inappropriate" | "sold" | "other";

/**
 * Everything the UI needs from a backend. `mockSource` implements it in memory;
 * `apiSource` is where the real HTTP calls go. Pages never call either directly —
 * they use the hooks in ./hooks.ts.
 */
/** Donations aggregated per district for the Home map. District level only, never an address. */
export interface DonationHub {
  district: string;
  /** People in this district who gave something away. */
  donors: number;
  /** Things given this month. */
  items: number;
  /** True when someone here gave something in the last 24 hours (the marker pulses). */
  fresh: boolean;
  /** Latest donations from people who chose to appear (first name only). */
  recent: { name: string; item: string; whenBn: string; whenEn: string }[];
}

export interface DonationMapData {
  hubs: DonationHub[];
  givenToday: number;
  givenThisMonth: number;
  districtsActive: number;
}

export interface SearchResult {
  posts: FeedPost[];
  /** Same-category posts, shown when nothing matched by name. */
  related: FeedPost[];
  /** How the AI read the search; null when plain matching answered. */
  ai: { terms: string[]; category: string; summary: string } | null;
}

export interface DataSource {
  listFeed(filters: FeedFilters): Promise<FeedPost[]>;
  /** Feed filters plus `q`, read by AI so other words and languages match too. */
  search(filters: FeedFilters): Promise<SearchResult>;
  /** My own live and given posts. */
  listMyPosts(): Promise<FeedPost[]>;
  getPost(id: string): Promise<FeedPost | null>;
  publishPost(input: NewPostInput): Promise<FeedPost>;
  /** Owner only: mark given, put back, or delete. */
  setMyPostStatus(id: string, status: "available" | "given" | "deleted"): Promise<void>;
  aiDraft(photos: File[]): Promise<AiDraft>;

  listChats(): Promise<Chat[]>;
  sendMessage(chatId: string, text: string): Promise<Chat>;
  markChatRead(chatId: string): Promise<void>;

  listExchanges(): Promise<Exchange[]>;
  advanceExchange(id: string): Promise<Exchange>;
  /** Giver only: the 4-digit code that proves a pickup handover happened. */
  getHandoverCode(exchangeId: string): Promise<string>;
  /** Receiver enters the giver's code; a wrong code is rejected and counted (5 tries). */
  confirmHandover(exchangeId: string, code: string): Promise<Exchange>;

  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string | "all"): Promise<void>;

  getUser(username: string): Promise<UserProfile | null>;
  getDashboard(): Promise<Dashboard>;
  getDonationMap(): Promise<DonationMapData>;
  /** "I want this" / "I have this" on a post. */
  requestItem(
    postId: string,
    input: { message: string; via: Delivery },
  ): Promise<{ exchangeId: string; conversationId: string | null }>;
  reportPost(postId: string, reason: ReportReason, details: string): Promise<void>;
  /** Receiver: thank-you note + stars for the giver. Giver: stars + note for the receiver. */
  sendThanks(exchangeId: string, text: string, stars: number): Promise<void>;

  /** Courier for one exchange: both agree (with a private address), then the receiver requests. */
  getCourier(exchangeId: string): Promise<CourierView>;
  agreeCourier(exchangeId: string, address: CourierAddress, weightKg?: number): Promise<void>;
  requestCourier(exchangeId: string, payment: CourierPaymentInput): Promise<void>;

  listCourierRequests(): Promise<CourierRequest[]>;
  decideCourierRequest(id: string, decision: "confirmed" | "rejected"): Promise<CourierRequest>;

  /** Eligible direct ads for a slot, already filtered by schedule and targeting. */
  getAdConfig(
    placement: AdPlacement,
    ctx?: { district?: string; category?: string },
  ): Promise<AdConfig>;
  trackAd(id: string, event: "impression" | "click"): Promise<void>;

  /** A published CMS page (terms, privacy, about, help); null while it's still a draft. */
  getPage(slug: string): Promise<{ title: string; body: string; updatedAt: string } | null>;
}
