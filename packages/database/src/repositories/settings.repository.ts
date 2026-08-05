import { getSupabaseClient } from "../client";

export type UserSettings = {
  user_id: string;
  public_profile_visibility: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  allow_direct_messages: boolean;
  search_engine_visibility: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NotificationPreferences = {
  user_id: string;
  exchange_updates: boolean;
  messages: boolean;
  need_requests: boolean;
  product_activity: boolean;
  marketing: boolean;
  reviews: boolean;
  browser_notifications: boolean;
  push_notifications: boolean;
  created_at?: string;
  updated_at?: string;
};

export class SettingsRepository {
  private getClient = () => getSupabaseClient(true);

  async getUserSettings(userId: string): Promise<UserSettings> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Create default if it doesn't exist
      const { data: newData, error: insertError } = await supabase
        .from("user_settings")
        .insert({ user_id: userId })
        .select()
        .single();

      if (insertError) throw new Error(`Error creating default settings: ${insertError.message}`);
      return newData as UserSettings;
    }

    if (error) {
      throw new Error(`Error fetching user settings: ${error.message}`);
    }

    return data as UserSettings;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const supabase = this.getClient();

    // Ensure the record exists first
    await this.getUserSettings(userId);

    const { data, error } = await supabase
      .from("user_settings")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }

    return data as UserSettings;
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Create default if it doesn't exist
      const { data: newData, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: userId })
        .select()
        .single();

      if (insertError)
        throw new Error(`Error creating default notifications: ${insertError.message}`);
      return newData as NotificationPreferences;
    }

    if (error) {
      throw new Error(`Error fetching notification preferences: ${error.message}`);
    }

    return data as NotificationPreferences;
  }

  async updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const supabase = this.getClient();

    // Ensure the record exists first
    await this.getNotificationPreferences(userId);

    const { data, error } = await supabase
      .from("notification_preferences")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating notification preferences: ${error.message}`);
    }

    return data as NotificationPreferences;
  }
}
