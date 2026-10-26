import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdPlacement } from "./platformStore";
import { source } from "./source";
import type {
  CourierAddress,
  CourierPaymentInput,
  Delivery,
  FeedFilters,
  NewPostInput,
  ReportReason,
} from "./types";

export const keys = {
  feed: (f: FeedFilters) => ["feed", f] as const,
  post: (id: string) => ["post", id] as const,
  chats: ["chats"] as const,
  exchanges: ["exchanges"] as const,
  notifications: ["notifications"] as const,
  user: (u: string) => ["user", u] as const,
  courier: ["courier"] as const,
  ads: (p: AdPlacement, district?: string, category?: string) =>
    ["ads", p, district, category] as const,
  courierView: (exchangeId: string) => ["courier-view", exchangeId] as const,
  myPosts: ["my-posts"] as const,
};

export const useFeed = (f: FeedFilters) =>
  useQuery({ queryKey: keys.feed(f), queryFn: () => source.listFeed(f) });

export const useSearch = (f: FeedFilters) =>
  useQuery({
    queryKey: ["search", f] as const,
    queryFn: () => source.search(f),
    enabled: !!f.q?.trim(),
    // The same search a minute later gives the same answer; don't spend AI quota on it.
    staleTime: 60_000,
  });

export const useMyPosts = () =>
  useQuery({ queryKey: keys.myPosts, queryFn: () => source.listMyPosts() });

export function useSetMyPostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: "available" | "given" | "deleted" }) =>
      source.setMyPostStatus(v.id, v.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.myPosts });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export const usePost = (id: string) =>
  useQuery({ queryKey: keys.post(id), queryFn: () => source.getPost(id) });

export const useDonationMap = () =>
  useQuery({
    queryKey: ["donation-map"],
    queryFn: () => source.getDonationMap(),
    staleTime: 5 * 60_000,
  });

export const useChats = () => useQuery({ queryKey: keys.chats, queryFn: () => source.listChats() });

export const useExchanges = () =>
  useQuery({ queryKey: keys.exchanges, queryFn: () => source.listExchanges() });

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: () => source.listNotifications() });

export const useUser = (username: string) =>
  useQuery({
    queryKey: keys.user(username),
    queryFn: () => source.getUser(username),
    enabled: !!username,
  });

export const useCourierRequests = () =>
  useQuery({ queryKey: keys.courier, queryFn: () => source.listCourierRequests() });

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { chatId: string; text: string }) => source.sendMessage(v.chatId, v.text),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.chats }),
  });
}

export function useMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => source.markChatRead(chatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.chats }),
  });
}

export function useAdvanceExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => source.advanceExchange(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.exchanges }),
  });
}

export const useHandoverCode = (exchangeId: string | null) =>
  useQuery({
    queryKey: ["handover-code", exchangeId],
    queryFn: () => source.getHandoverCode(exchangeId as string),
    enabled: !!exchangeId,
    staleTime: Number.POSITIVE_INFINITY,
  });

export function useConfirmHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { exchangeId: string; code: string }) =>
      source.confirmHandover(v.exchangeId, v.code),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.exchanges }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | "all") => source.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  });
}

export function useDecideCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; decision: "confirmed" | "rejected" }) =>
      source.decideCourierRequest(v.id, v.decision),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.courier }),
  });
}

export const useAiDraft = () =>
  useMutation({ mutationFn: (photos: File[]) => source.aiDraft(photos) });

export function usePublishPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPostInput) => source.publishPost(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export const useAdConfig = (
  placement: AdPlacement,
  ctx?: { district?: string; category?: string },
) =>
  useQuery({
    queryKey: keys.ads(placement, ctx?.district, ctx?.category),
    queryFn: () => source.getAdConfig(placement, ctx),
    staleTime: 60_000,
  });

export const trackAd = (id: string, event: "impression" | "click") =>
  source.trackAd(id, event).catch(() => {}); // analytics must never break the page

export const useCourier = (exchangeId: string | null) =>
  useQuery({
    queryKey: keys.courierView(exchangeId ?? ""),
    queryFn: () => source.getCourier(exchangeId as string),
    enabled: !!exchangeId,
  });

export function useAgreeCourier(exchangeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { address: CourierAddress; weightKg?: number }) =>
      source.agreeCourier(exchangeId, v.address, v.weightKg),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.courierView(exchangeId) }),
  });
}

export function useRequestCourier(exchangeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payment: CourierPaymentInput) => source.requestCourier(exchangeId, payment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.courierView(exchangeId) });
      qc.invalidateQueries({ queryKey: keys.exchanges });
    },
  });
}

export const usePage = (slug: string) =>
  useQuery({
    queryKey: ["page", slug],
    queryFn: () => source.getPage(slug),
    staleTime: 5 * 60_000,
  });

export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => source.getDashboard() });

export function useRequestItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { postId: string; message: string; via: Delivery }) =>
      source.requestItem(v.postId, { message: v.message, via: v.via }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: keys.post(v.postId) });
    },
  });
}

export const useReportPost = () =>
  useMutation({
    mutationFn: (v: { postId: string; reason: ReportReason; details: string }) =>
      source.reportPost(v.postId, v.reason, v.details),
  });

export function useSendThanks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { exchangeId: string; text: string; stars: number }) =>
      source.sendThanks(v.exchangeId, v.text, v.stars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.exchanges });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
