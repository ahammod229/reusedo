import { z } from "zod";

// --- Profile Schemas ---

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional()
    .nullable(),
  display_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  date_of_birth: z.string().optional().nullable(), // YYYY-MM-DD
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  phone_number: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .optional()
    .nullable(),
  district: z.string().optional().nullable(),
  upazila: z.string().optional().nullable(),
  preferred_language: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export interface UserProfile {
  id: string;
  email?: string | null;
  username: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  district?: string | null;
  upazila?: string | null;
  preferred_language?: string | null;
  is_verified?: boolean;
  trust_score?: number;
  join_date?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Address Schemas ---

export const addressSchema = z.object({
  label: z.string().min(1).max(50), // Home, Office, etc.
  recipient_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  district: z.string().min(1),
  upazila: z.string().min(1),
  area: z.string().min(1),
  postal_code: z.string().min(4).max(10),
  landmark: z.string().max(200).optional().nullable(),
  is_default: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type AddressData = z.infer<typeof addressSchema>;
export type UpdateAddressData = z.infer<typeof updateAddressSchema>;
export type UserAddress = AddressData & { id: string };

// --- Settings & Preferences Schemas ---

export const userSettingsSchema = z.object({
  public_profile_visibility: z.boolean(),
  show_email: z.boolean(),
  show_phone: z.boolean(),
  show_location: z.boolean(),
  allow_direct_messages: z.boolean(),
  search_engine_visibility: z.boolean(),
});

export const updateUserSettingsSchema = userSettingsSchema.partial();

export type UserSettingsData = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettingsData = z.infer<typeof updateUserSettingsSchema>;

export const notificationPreferencesSchema = z.object({
  exchange_updates: z.boolean(),
  messages: z.boolean(),
  need_requests: z.boolean(),
  product_activity: z.boolean(),
  marketing: z.boolean(),
  reviews: z.boolean(),
  browser_notifications: z.boolean(),
  push_notifications: z.boolean(),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();

export type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>;
export type UpdateNotificationPreferencesData = z.infer<typeof updateNotificationPreferencesSchema>;
