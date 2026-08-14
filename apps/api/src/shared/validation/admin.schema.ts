import { z } from "zod";

// Admin Role Types
export const adminRoleSchema = z.enum([
  "super_admin",
  "admin",
  "moderator",
  "support_agent",
  "content_manager",
]);
export type AdminRole = z.infer<typeof adminRoleSchema>;

export const assignRoleSchema = z.object({
  role: adminRoleSchema.nullable(),
});

// CMS Page Schema
export const cmsPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  is_published: z.boolean().default(false),
});

export type CMSPageData = z.infer<typeof cmsPageSchema>;

export const updateCmsPageSchema = cmsPageSchema.partial();
export type UpdateCMSPageData = z.infer<typeof updateCmsPageSchema>;

// Platform Settings Schema
export const platformSettingsSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

export type PlatformSettingsData = z.infer<typeof platformSettingsSchema>;

// Feature Flags Schema
export const featureFlagSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  is_enabled: z.boolean().default(false),
  scheduled_activation: z.string().datetime().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
});

export type FeatureFlagData = z.infer<typeof featureFlagSchema>;

export const updateFeatureFlagSchema = featureFlagSchema.partial();
export type UpdateFeatureFlagData = z.infer<typeof updateFeatureFlagSchema>;
