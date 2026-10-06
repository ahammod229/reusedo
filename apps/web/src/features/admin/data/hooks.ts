import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSource as s } from "./source";
import type {
  AdminCategory,
  AdminContentPage,
  AdminPost,
  AdminReport,
  AdminSettings,
  AdminUser,
} from "./types";

const q = <T>(key: string, fn: () => Promise<T>) =>
  useQuery({ queryKey: ["admin", key], queryFn: fn });

export const useAdminStats = () => q("stats", () => s.stats());
export const useAdminUsers = () => q("users", () => s.listUsers());
export const useAdminPosts = () => q("posts", () => s.listPosts());
export const useAdminExchanges = () => q("exchanges", () => s.listExchanges());
export const useAdminReports = () => q("reports", () => s.listReports());
export const useAdminVerifications = () => q("verifications", () => s.listVerifications());
export const useAdminReviews = () => q("reviews", () => s.listReviews());
export const useAdminCategories = () => q("categories", () => s.listCategories());
export const useAdminPages = () => q("pages", () => s.listPages());
export const useAdminSettings = () => q("settings", () => s.getSettings());
export const useAdminFlags = () => q("flags", () => s.listFlags());
export const useAdminAudit = () => q("audit", () => s.listAudit());

/** Every admin action is audited, so each mutation refreshes its own list plus the audit log and dashboard counters. */
function useAct<V>(keys: string[], fn: (v: V) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const k of [...keys, "audit", "stats"]) qc.invalidateQueries({ queryKey: ["admin", k] });
    },
  });
}

export const useSetUserStatus = () =>
  useAct<{ id: string; status: AdminUser["status"] }>(["users"], (v) =>
    s.setUserStatus(v.id, v.status),
  );
export const useSetPostStatus = () =>
  useAct<{ id: string; status: AdminPost["status"] }>(["posts"], (v) =>
    s.setPostStatus(v.id, v.status),
  );
export const useCancelExchange = () => useAct<string>(["exchanges"], (id) => s.cancelExchange(id));
export const useSetReportStatus = () =>
  useAct<{ id: string; status: AdminReport["status"]; hideTarget?: boolean }>(
    ["reports", "posts"],
    (v) => s.setReportStatus(v.id, v.status, v.hideTarget),
  );
export const useDecideVerification = () =>
  useAct<{ id: string; status: "approved" | "rejected" }>(["verifications"], (v) =>
    s.decideVerification(v.id, v.status),
  );
export const useDeleteReview = () => useAct<string>(["reviews"], (id) => s.deleteReview(id));
export const useSaveCategory = () =>
  useAct<AdminCategory>(["categories"], (c) => s.saveCategory(c));
export const useSavePage = () => useAct<AdminContentPage>(["pages"], (p) => s.savePage(p));
export const useSaveSettings = () => useAct<AdminSettings>(["settings"], (v) => s.saveSettings(v));
export const useSetFlag = () =>
  useAct<{ key: string; enabled: boolean }>(["flags"], (v) => s.setFlag(v.key, v.enabled));
