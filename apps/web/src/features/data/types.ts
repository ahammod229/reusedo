import type { CourierRequestItem, FeedPost, PostKind } from "@/features/feed/types";
import type {
  ExchangeStatus,
  MockConversation,
  MockExchange,
  MockNotification,
  MockUser,
} from "@/features/feed/mock";

export type { ExchangeStatus };
export type Chat = MockConversation;
export type ChatMessage = MockConversation["messages"][number];
export type Exchange = MockExchange;
export type AppNotification = MockNotification;
export type UserProfile = MockUser;
export type CourierRequest = CourierRequestItem;

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
}
