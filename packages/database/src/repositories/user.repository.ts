import { getSupabaseClient } from "../client";

export type UserProfile = {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  username?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  district?: string | null;
  upazila?: string | null;
  preferred_language?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  is_verified?: boolean;
  join_date?: string;
  role: "USER" | "ADMIN";
  created_at?: string;
  updated_at?: string;
};

export const UserRepository = {
  // Use service role because this is called by backend admin syncing
  getClient: () => getSupabaseClient(true),

  async syncProfile(data: {
    firebaseUid: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  }): Promise<UserProfile> {
    const supabase = this.getClient();

    const { data: existingUser, error: findError } = await supabase
      .from("profiles")
      .select("*")
      .eq("firebase_uid", data.firebaseUid)
      .single();

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 means zero rows found, which is fine
      throw new Error(`Error fetching user profile: ${findError.message}`);
    }

    if (existingUser) {
      return existingUser as UserProfile;
    }

    // Create new profile
    const { data: newUser, error: insertError } = await supabase
      .from("profiles")
      .insert({
        firebase_uid: data.firebaseUid,
        email: data.email,
        display_name: data.displayName,
        avatar_url: data.avatarUrl || null,
        role: "USER",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error creating user profile: ${insertError.message}`);
    }

    return newUser as UserProfile;
  },

  async getProfileByUid(firebaseUid: string): Promise<UserProfile | null> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    return data as UserProfile;
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = this.getClient();

    // Prevent updating critical fields directly
    const safeUpdates = { ...updates };
    safeUpdates.id = undefined;
    safeUpdates.firebase_uid = undefined;
    safeUpdates.email = undefined;
    safeUpdates.role = undefined;

    const { data, error } = await supabase
      .from("profiles")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }

    return data as UserProfile;
  },

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching user profile by username: ${error.message}`);
    }

    return data as UserProfile;
  }
};
