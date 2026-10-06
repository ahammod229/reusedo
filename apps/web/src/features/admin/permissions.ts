import { useAuthStore } from "@/features/auth";
import { UI_PREVIEW } from "@/shared/uiPreview";
import type { AdminRole } from "./data/types";

/** Which roles may open each admin area. Mirrors `requireAdmin([...])` in apps/api. */
export const ACCESS: Record<string, AdminRole[]> = {
  dashboard: ["super_admin", "admin", "moderator"],
  posts: ["super_admin", "admin", "moderator"],
  reports: ["super_admin", "admin", "moderator"],
  verification: ["super_admin", "admin", "moderator"],
  reviews: ["super_admin", "admin", "moderator"],
  exchanges: ["super_admin", "admin", "moderator"],
  courier: ["super_admin", "admin"],
  users: ["super_admin", "admin"],
  categories: ["super_admin", "admin"],
  cms: ["super_admin", "admin"],
  analytics: ["super_admin", "admin"],
  ads: ["super_admin", "admin"],
  settings: ["super_admin"],
  features: ["super_admin"],
  audit: ["super_admin", "admin"],
};

/** Current admin's role. UI preview acts as super_admin; otherwise read it from the signed-in user. */
export function useAdminRole(): AdminRole {
  const user = useAuthStore((s) => s.user) as { adminRole?: AdminRole } | null;
  if (UI_PREVIEW) return "super_admin";
  return user?.adminRole ?? "moderator"; // least privilege when unknown
}

export const can = (role: AdminRole, area: keyof typeof ACCESS) => ACCESS[area].includes(role);
