import type {
  Notification,
  NotificationPreferencesData,
  UpdateNotificationPreferencesData,
} from "@/shared/validation";
import { apiClient } from "../index";

export const NotificationService = {
  /**
   * Fetch paginated notifications for the current user
   */
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    is_read?: boolean;
  }): Promise<{ data: Notification[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    if (params?.type) searchParams.append("type", params.type);
    if (params?.is_read !== undefined) searchParams.append("is_read", params.is_read.toString());

    const response = await apiClient.get<{ data: Notification[]; count: number }>(
      `/notifications?${searchParams.toString()}`,
    );
    return response.data;
  },

  /**
   * Fetch unread notification count
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<{ unreadCount: number }>("/notifications/count");
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>("/notifications/read-all");
    return response.data;
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Register FCM Token for Push Notifications
   */
  async registerFCMToken(token: string, deviceInfo?: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>("/notifications/fcm-token", {
      token,
      device_info: deviceInfo,
    });
    return response.data;
  },

  /**
   * Get User Notification Preferences
   */
  async getPreferences(): Promise<NotificationPreferencesData> {
    const response = await apiClient.get<NotificationPreferencesData>("/users/me/notifications");
    return response.data;
  },

  /**
   * Update User Notification Preferences
   */
  async updatePreferences(
    data: UpdateNotificationPreferencesData,
  ): Promise<NotificationPreferencesData> {
    const response = await apiClient.patch<NotificationPreferencesData>(
      "/users/me/notifications",
      data,
    );
    return response.data;
  },
};
