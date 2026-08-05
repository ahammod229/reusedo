import { apiClient } from "../index";
import type { 
  UserProfile, 
  UserAddress, 
  UserSettings, 
  NotificationPreferences 
} from "@reusedo/database";
import type { 
  UpdateProfileData, 
  AddressData, 
  UpdateAddressData,
  UpdateUserSettingsData,
  UpdateNotificationPreferencesData
} from "@reusedo/validation";

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

  async getMySettings(): Promise<UserSettings> {
    const { data } = await apiClient.get<UserSettings>("/users/me/settings");
    return data;
  },

  async updateMySettings(updates: UpdateUserSettingsData): Promise<UserSettings> {
    const { data } = await apiClient.patch<UserSettings>("/users/me/settings", updates);
    return data;
  },

  async getMyNotificationPreferences(): Promise<NotificationPreferences> {
    const { data } = await apiClient.get<NotificationPreferences>("/users/me/notifications");
    return data;
  },

  async updateMyNotificationPreferences(updates: UpdateNotificationPreferencesData): Promise<NotificationPreferences> {
    const { data } = await apiClient.patch<NotificationPreferences>("/users/me/notifications", updates);
    return data;
  }
}
