import type {
  AddressData,
  NotificationPreferencesData,
  UpdateAddressData,
  UpdateNotificationPreferencesData,
  UpdateProfileData,
  UpdateUserSettingsData,
  UserAddress,
  UserProfile,
  UserSettingsData,
} from "@/shared/validation";
import { apiClient } from "../index";

export const UserService = {
  async getMyProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/users/me");
    return data;
  },

  async updateMyProfile(updates: UpdateProfileData): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>("/users/me", updates);
    return data;
  },

  async getPublicProfile(username: string): Promise<Partial<UserProfile>> {
    const { data } = await apiClient.get<Partial<UserProfile>>(`/users/${username}`);
    return data;
  },

  async getMyAddresses(): Promise<UserAddress[]> {
    const { data } = await apiClient.get<UserAddress[]>("/users/me/addresses");
    return data;
  },

  async addAddress(address: AddressData): Promise<UserAddress> {
    const { data } = await apiClient.post<UserAddress>("/users/me/addresses", address);
    return data;
  },

  async updateAddress(id: string, updates: UpdateAddressData): Promise<UserAddress> {
    const { data } = await apiClient.put<UserAddress>(`/users/me/addresses/${id}`, updates);
    return data;
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/users/me/addresses/${id}`);
  },

  async getMySettings(): Promise<UserSettingsData> {
    const { data } = await apiClient.get<UserSettingsData>("/users/me/settings");
    return data;
  },

  async updateMySettings(updates: UpdateUserSettingsData): Promise<UserSettingsData> {
    const { data } = await apiClient.patch<UserSettingsData>("/users/me/settings", updates);
    return data;
  },

  async getMyNotificationPreferences(): Promise<NotificationPreferencesData> {
    const { data } = await apiClient.get<NotificationPreferencesData>("/users/me/notifications");
    return data;
  },

  async updateMyNotificationPreferences(
    updates: UpdateNotificationPreferencesData,
  ): Promise<NotificationPreferencesData> {
    const { data } = await apiClient.patch<NotificationPreferencesData>(
      "/users/me/notifications",
      updates,
    );
    return data;
  },
};
