import { getSupabaseClient } from "../client";

export const AnalyticsRepository = {
  async getUserDashboardSummary(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_user_dashboard_summary', { p_user_id: userId });
    if (error) {
      console.error("getUserDashboardSummary Error:", error);
      throw error;
    }
    return data;
  },

  async getAdminKpiSummary() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_admin_kpi_summary');
    if (error) {
      console.error("getAdminKpiSummary Error:", error);
      throw error;
    }
    return data;
  },

  async getPersonalAnalytics(userId: string) {
    // For now, doing separate counts, this can be moved to an RPC for efficiency later.
    const supabase = getSupabaseClient();
    
    const [publishedProducts, totalExchanges, totalNeeds] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "published"),
      supabase.from("exchanges").select("*", { count: "exact", head: true }).or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase.from("needs").select("*", { count: "exact", head: true }).eq("owner_id", userId)
    ]);

    return {
      products_published: publishedProducts.count || 0,
      total_exchanges: totalExchanges.count || 0,
      need_requests_created: totalNeeds.count || 0,
      exchange_success_rate: 0, // Placeholder
      average_response_time: '2 hours', // Placeholder
      total_reviews: 0,
      average_rating: 0.0,
      profile_views: 0
    };
  }
};
