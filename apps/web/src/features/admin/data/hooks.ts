import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSource as s } from "./source";
import type {
  AdCampaign,
  AdNetworkSettings,
  AdminCategory,
  AdminContentPage,
  AdminPost,
  AdminReport,
  AdminRiskCase,
  AdminSettings,
  AdminUser,
  BlockEntry,
  IntegrationUpdate,
  Payment,
  PaymentSettings,
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
export const useIntegrations = () => q("integrations", () => s.listIntegrations());
export const useAdminPayments = () => q("payments", () => s.listPayments());
export const usePaymentSettings = () => q("paymentSettings", () => s.getPaymentSettings());
export const useRiskCases = () => q("risk", () => s.listRiskCases());
export const useBlocklist = () => q("blocklist", () => s.listBlocklist());
export const useAdminAds = () => q("ads", () => s.listAds());
export const useAdNetwork = () => q("adNetwork", () => s.getAdNetwork());

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

export const useSaveIntegration = () =>
  useAct<IntegrationUpdate>(["integrations"], (u) => s.saveIntegration(u));
export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: IntegrationUpdate["id"]) => s.testIntegration(id),
    onSettled: () => {
      for (const k of ["integrations", "audit"]) qc.invalidateQueries({ queryKey: ["admin", k] });
    },
  });
}

export const useDecidePayment = () =>
  useAct<{ id: string; status: Payment["status"]; note?: string }>(["payments"], (v) =>
    s.decidePayment(v.id, v.status, v.note),
  );
export const useSavePaymentSettings = () =>
  useAct<PaymentSettings>(["paymentSettings"], (v) => s.savePaymentSettings(v));

export const useDecideRisk = () =>
  useAct<{ id: string; status: AdminRiskCase["status"]; note?: string; blockPhone?: boolean }>(
    ["risk", "blocklist"],
    (v) => s.decideRisk(v.id, v.status, { note: v.note, blockPhone: v.blockPhone }),
  );
export const useLookupPhone = () => useMutation({ mutationFn: (p: string) => s.lookupPhone(p) });
export const useAddBlock = () =>
  useAct<Omit<BlockEntry, "id" | "added">>(["blocklist", "risk"], (b) => s.addBlock(b));
export const useRemoveBlock = () =>
  useAct<string>(["blocklist", "risk"], (id) => s.removeBlock(id));

// Ads also invalidate the public ["ads"] slot queries so the feed updates at once.
function useAdAct<V>(keys: string[], fn: (v: V) => Promise<void>) {
  const qc = useQueryClient();
  const m = useAct(keys, fn);
  return {
    ...m,
    mutate: (v: V) => m.mutate(v, { onSuccess: () => qc.invalidateQueries({ queryKey: ["ads"] }) }),
  };
}
export const useSaveAd = () => useAdAct<AdCampaign>(["ads"], (a) => s.saveAd(a));
export const useDeleteAd = () => useAdAct<string>(["ads"], (id) => s.deleteAd(id));
export const useSaveAdNetwork = () =>
  useAdAct<AdNetworkSettings>(["adNetwork", "integrations"], (v) => s.saveAdNetwork(v));
