import type { CategoryId } from "@/features/feed/types";

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
}
