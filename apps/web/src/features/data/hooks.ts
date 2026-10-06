import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdPlacement } from "./platformStore";
import { source } from "./source";
import type { CourierPaymentInput, FeedFilters, NewPostInput } from "./types";

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
  checkout: ["checkout"] as const,
};

export const useFeed = (f: FeedFilters) =>
  useQuery({ queryKey: keys.feed(f), queryFn: () => source.listFeed(f) });

export const usePost = (id: string) =>
  useQuery({ queryKey: keys.post(id), queryFn: () => source.getPost(id) });

export const useChats = () => useQuery({ queryKey: keys.chats, queryFn: () => source.listChats() });

export const useExchanges = () =>
  useQuery({ queryKey: keys.exchanges, queryFn: () => source.listExchanges() });

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: () => source.listNotifications() });

export const useUser = (username: string) =>
  useQuery({ queryKey: keys.user(username), queryFn: () => source.getUser(username) });

export const useCourierRequests = () =>
  useQuery({ queryKey: keys.courier, queryFn: () => source.listCourierRequests() });

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { chatId: string; text: string }) => source.sendMessage(v.chatId, v.text),
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

export const useCheckoutConfig = () =>
  useQuery({ queryKey: keys.checkout, queryFn: () => source.getCheckoutConfig() });

export const useSubmitCourierPayment = () =>
  useMutation({ mutationFn: (v: CourierPaymentInput) => source.submitCourierPayment(v) });
