import type {
  ExchangeStatus,
  MockConversation,
  MockExchange,
  MockNotification,
  MockUser,
} from "@/features/feed/mock";
import type { CourierRequestItem, FeedPost, PostKind } from "@/features/feed/types";
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

export interface FeedFilters {
  kind: PostKind | "all";
  category: string;
  scope: "area" | "district" | "country";
  /** Free-text search over title and description. */
  q?: string;
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
}

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
