import { z } from "zod";

export const userDashboardSummarySchema = z.object({
  active_exchanges: z.number().int(),
  my_products: z.number().int(),
  my_needs: z.number().int(),
  unread_notifications: z.number().int(),
  trust_score: z.number().int(),
});

export const adminKpiSummarySchema = z.object({
  total_users: z.number().int(),
  active_users: z.number().int(),
  total_products: z.number().int(),
  total_needs: z.number().int(),
  total_exchanges: z.number().int(),
  completed_exchanges: z.number().int(),
  success_rate: z.number(),
});

export const personalAnalyticsSchema = z.object({
  products_published: z.number().int(),
  total_exchanges: z.number().int(),
  need_requests_created: z.number().int(),
  exchange_success_rate: z.number(),
  average_response_time: z.string(),
  total_reviews: z.number().int(),
  average_rating: z.number(),
  profile_views: z.number().int(),
});

export type UserDashboardSummary = z.infer<typeof userDashboardSummarySchema>;
export type AdminKpiSummary = z.infer<typeof adminKpiSummarySchema>;
export type PersonalAnalytics = z.infer<typeof personalAnalyticsSchema>;
