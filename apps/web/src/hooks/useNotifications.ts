import { apiClient } from "@reusedo/api-client";
import type {
  Notification,
  NotificationPreferencesData,
  UpdateNotificationPreferencesData,
} from "@reusedo/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotifications(options?: {
  limit?: number;
  offset?: number;
  type?: string;
  is_read?: boolean;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", options],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (options?.limit) searchParams.append("limit", options.limit.toString());
      if (options?.offset) searchParams.append("offset", options.offset.toString());
      if (options?.type) searchParams.append("type", options.type);
      if (options?.is_read !== undefined)
        searchParams.append("is_read", options.is_read.toString());

      const res = await apiClient.get<{ data: Notification[]; count: number }>(
        `/notifications?${searchParams.toString()}`,
      );
      return res.data;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification_count"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await apiClient.post("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification_count"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification_count"] });
    },
  });

  return {
    ...query,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notification_count"],
    queryFn: async () => {
      const res = await apiClient.get<{ unreadCount: number }>("/notifications/count");
      return res.data.unreadCount;
    },
    refetchInterval: 30000, // Background poll every 30s as a fallback to realtime
  });
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notification_preferences"],
    queryFn: async () => {
      const res = await apiClient.get<NotificationPreferencesData>("/users/me/notifications");
      return res.data;
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (data: UpdateNotificationPreferencesData) => {
      const res = await apiClient.patch<NotificationPreferencesData>(
        "/users/me/notifications",
        data,
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["notification_preferences"], data);
    },
  });

  return {
    ...query,
    updatePreferences,
  };
}
