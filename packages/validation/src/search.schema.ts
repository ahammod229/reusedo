import { z } from "zod";

export const savedSearchSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  query: z.string().optional().nullable(),
  filters: z.record(z.string(), z.unknown()).default({}),
  type: z.enum(['global', 'products', 'needs', 'users']),
  created_at: z.string()
});

export const createSavedSearchSchema = savedSearchSchema.omit({ 
  id: true, 
  user_id: true, 
  created_at: true 
});

export const recentSearchSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  keyword: z.string().min(1),
  type: z.enum(['global', 'products', 'needs', 'users']).default('global'),
  created_at: z.string()
});

export const recentlyViewedSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  item_type: z.enum(['product', 'need', 'user']),
  item_id: z.string().uuid(),
  viewed_at: z.string()
});

export const searchAnalyticsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  keyword: z.string(),
  result_count: z.number().int().default(0),
  clicked_item_id: z.string().uuid().nullable(),
  created_at: z.string()
});

export const logSearchAnalyticsSchema = searchAnalyticsSchema.pick({
  keyword: true,
  result_count: true,
}).extend({
  clicked_item_id: z.string().uuid().optional(),
});

export const searchFiltersSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  district: z.string().optional(),
  upazila: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  verified: z.boolean().optional(),
  sortBy: z.enum(['relevant', 'newest', 'oldest', 'most_viewed', 'alphabetical']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0)
});

export type SavedSearch = z.infer<typeof savedSearchSchema>;
export type CreateSavedSearchData = z.infer<typeof createSavedSearchSchema>;
export type RecentSearch = z.infer<typeof recentSearchSchema>;
export type RecentlyViewed = z.infer<typeof recentlyViewedSchema>;
export type SearchAnalytics = z.infer<typeof searchAnalyticsSchema>;
export type LogSearchAnalyticsData = z.infer<typeof logSearchAnalyticsSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
