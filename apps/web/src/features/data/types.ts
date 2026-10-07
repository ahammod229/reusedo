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

export interface CourierPaymentInput {
  courierId: string;
  item: string;
  payer: string;
  phone: string;
  amount: number;
  method: PaymentMethod;
  trxId?: string;
  senderNumber?: string;
}

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
export interface DataSource {
  listFeed(filters: FeedFilters): Promise<FeedPost[]>;
  getPost(id: string): Promise<FeedPost | null>;
  publishPost(input: NewPostInput): Promise<FeedPost>;
  aiDraft(photos: File[]): Promise<AiDraft>;

  listChats(): Promise<Chat[]>;
  sendMessage(chatId: string, text: string): Promise<Chat>;

  listExchanges(): Promise<Exchange[]>;
  advanceExchange(id: string): Promise<Exchange>;

  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string | "all"): Promise<void>;

  getUser(username: string): Promise<UserProfile | null>;
  getDashboard(): Promise<Dashboard>;
  /** "I want this" / "I have this" on a post. */
  requestItem(postId: string, input: { message: string; via: Delivery }): Promise<void>;
  reportPost(postId: string, reason: ReportReason, details: string): Promise<void>;
  sendThanks(exchangeId: string, text: string): Promise<void>;

  listCourierRequests(): Promise<CourierRequest[]>;
  decideCourierRequest(id: string, decision: "confirmed" | "rejected"): Promise<CourierRequest>;

  /** Eligible direct ads for a slot, already filtered by schedule and targeting. */
  getAdConfig(
    placement: AdPlacement,
    ctx?: { district?: string; category?: string },
  ): Promise<AdConfig>;
  trackAd(id: string, event: "impression" | "click"): Promise<void>;

  getCheckoutConfig(): Promise<CheckoutConfig>;
  submitCourierPayment(input: CourierPaymentInput): Promise<Payment>;
}
