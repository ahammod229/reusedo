import type {
  AdCampaign,
  AdNetworkSettings,
  Payment,
  PaymentSettings,
} from "@/features/data/platformStore";
import type { CategoryId } from "@/features/feed/types";

export type { AdCampaign, AdNetworkSettings, Payment, PaymentSettings };

export type AdminRole = "super_admin" | "admin" | "moderator";

export interface AdminStats {
  users: number;
  usersDelta: number;
  activePosts: number;
  postsDelta: number;
  exchangesMonth: number;
  exchangesDelta: number;
  pendingCourier: number;
  openReports: number;
  pendingVerifications: number;
  pendingPayments: number;
  openRisk: number;
  series: { day: string; posts: number; exchanges: number; signups: number }[];
  byCategory: { category: CategoryId; count: number }[];
  topDistricts: { district: string; count: number }[];
  ads: { impressions: number; clicks: number; estRevenue: number };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  district: string;
  joined: string;
  role: "user" | AdminRole;
  status: "active" | "suspended";
  verified: boolean;
  posts: number;
  trust: number;
}

export interface AdminPost {
  id: string;
  title: string;
  kind: "offer" | "need";
  author: string;
  category: CategoryId;
  status: "published" | "hidden" | "deleted";
  reports: number;
  created: string;
}

export interface AdminExchange {
  id: string;
  item: string;
  giver: string;
  receiver: string;
  status: "requested" | "accepted" | "scheduled" | "completed" | "cancelled";
  via: "pickup" | "courier";
  updated: string;
}

export interface AdminReport {
  id: string;
  targetType: "post" | "user" | "message" | "review";
  targetLabel: string;
  reason: "spam" | "fraud" | "abuse" | "fake_item" | "inappropriate" | "other";
  details: string;
  reporter: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  created: string;
}

export interface AdminVerification {
  id: string;
  user: string;
  email: string;
  address: string;
  /** Why automatic checks flagged this account for a human look. */
  flags: string[];
  status: "pending" | "approved" | "rejected";
  created: string;
}

export interface AdminReview {
  id: string;
  from: string;
  to: string;
  stars: number;
  text: string;
  created: string;
  flagged: boolean;
}

export interface AdminCategory {
  id: string;
  bn: string;
  en: string;
  emoji: string;
  enabled: boolean;
  posts: number;
}

export interface AdminContentPage {
  slug: string;
  title: string;
  body: string;
  status: "published" | "draft";
  updated: string;
}

export interface AdminSettings {
  supportEmail: string;
  aiDailyLimit: number;
  maxPhotos: number;
  requestExpiryDays: number;
  maintenanceMode: boolean;
}

export interface AdminFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  when: string;
}

export type IntegrationId =
  | "gemini"
  | "steadfast"
  | "email"
  | "firebase"
  | "maps"
  | "sms"
  | "bkash"
  | "nagad"
  | "admanager";

export interface IntegrationField {
  key: string;
  label: string;
  /** Secrets are write-only: the server never sends them back, only `last4`. */
  secret: boolean;
  value?: string;
  last4?: string;
  set: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  /** Not needed for the integration to work. */
  optional?: boolean;
}

export interface IntegrationCheck {
  ok: boolean;
  ms: number;
  message: string;
  at: string;
}

export interface Integration {
  id: IntegrationId;
  name: string;
  group: "core" | "payment" | "optional";
  purpose: string;
  docsUrl: string;
  enabled: boolean;
  /** Payment gateways have sandbox/live credentials. */
  mode?: "sandbox" | "live";
  fields: IntegrationField[];
  /** Public URL the provider calls back (copy into its dashboard). */
  webhook?: string;
  /** Managed on another admin screen (e.g. Ad Manager → Ads). */
  manageHref?: string;
  lastCheck?: IntegrationCheck;
  usage?: { label: string; used: number; limit: number };
}

export type IntegrationStatus = "connected" | "untested" | "error" | "not_configured" | "disabled";

export interface IntegrationUpdate {
  id: IntegrationId;
  enabled?: boolean;
  mode?: "sandbox" | "live";
  /** Only the fields being changed. An empty secret string clears it. */
  values?: Record<string, string>;
}

export type RiskLevel = "low" | "medium" | "high";

export interface RiskSignal {
  key: string;
  label: string;
  detail: string;
  result: "pass" | "warn" | "fail";
  /** Points added to the score on fail (half on warn). */
  weight: number;
}

export interface CourierHistory {
  total: number;
  delivered: number;
  returned: number;
  source: string;
}

export interface AdminRiskCase {
  id: string;
  courierId?: string;
  item: string;
  user: string;
  phone: string;
  email: string;
  address: { district: string; thana: string; line: string };
  accountAgeDays: number;
  signals: RiskSignal[];
  history: CourierHistory | null;
  status: "open" | "approved" | "held" | "rejected";
  note?: string;
  created: string;
}

export interface BlockEntry {
  id: string;
  type: "phone" | "email" | "device" | "address";
  value: string;
  reason: string;
  added: string;
}

export interface PhoneLookup {
  phone: string;
  valid: boolean;
  operator?: string;
  history: CourierHistory | null;
  accounts: string[];
  blocked: boolean;
}

/** Everything the admin UI needs. Mirrors apps/api `/api/admin/*` — see apiSource notes. */
export interface AdminSource {
  stats(): Promise<AdminStats>;
  listUsers(): Promise<AdminUser[]>;
  setUserStatus(id: string, status: AdminUser["status"]): Promise<void>;
  listPosts(): Promise<AdminPost[]>;
  setPostStatus(id: string, status: AdminPost["status"]): Promise<void>;
  listExchanges(): Promise<AdminExchange[]>;
  cancelExchange(id: string): Promise<void>;
  listReports(): Promise<AdminReport[]>;
  setReportStatus(id: string, status: AdminReport["status"], hideTarget?: boolean): Promise<void>;
  listVerifications(): Promise<AdminVerification[]>;
  decideVerification(id: string, status: "approved" | "rejected"): Promise<void>;
  listReviews(): Promise<AdminReview[]>;
  deleteReview(id: string): Promise<void>;
  listCategories(): Promise<AdminCategory[]>;
  saveCategory(c: AdminCategory): Promise<void>;
  listPages(): Promise<AdminContentPage[]>;
  savePage(p: AdminContentPage): Promise<void>;
  getSettings(): Promise<AdminSettings>;
  saveSettings(s: AdminSettings): Promise<void>;
  listFlags(): Promise<AdminFlag[]>;
  setFlag(key: string, enabled: boolean): Promise<void>;
  listAudit(): Promise<AuditEntry[]>;

  listIntegrations(): Promise<Integration[]>;
  saveIntegration(u: IntegrationUpdate): Promise<void>;
  testIntegration(id: IntegrationId): Promise<IntegrationCheck>;

  listPayments(): Promise<Payment[]>;
  decidePayment(id: string, status: Payment["status"], note?: string): Promise<void>;
  getPaymentSettings(): Promise<PaymentSettings>;
  savePaymentSettings(s: PaymentSettings): Promise<void>;

  listRiskCases(): Promise<AdminRiskCase[]>;
  decideRisk(
    id: string,
    status: AdminRiskCase["status"],
    opts?: { note?: string; blockPhone?: boolean },
  ): Promise<void>;
  lookupPhone(phone: string): Promise<PhoneLookup>;
  listBlocklist(): Promise<BlockEntry[]>;
  addBlock(b: Omit<BlockEntry, "id" | "added">): Promise<void>;
  removeBlock(id: string): Promise<void>;

  listAds(): Promise<AdCampaign[]>;
  saveAd(a: AdCampaign): Promise<void>;
  deleteAd(id: string): Promise<void>;
  getAdNetwork(): Promise<AdNetworkSettings>;
  saveAdNetwork(s: AdNetworkSettings): Promise<void>;
}
