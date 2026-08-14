import { getSupabaseClient } from "../client";

export const AnalyticsRepository = {
  async getUserDashboardSummary(userId: string) {
    const supabase = getSupabaseClient();
    try {
      // First try the RPC
      const { data, error } = await supabase.rpc('get_user_dashboard_summary', { p_user_id: userId });
      if (!error && data) return data;
    } catch (e) {
      console.warn("RPC get_user_dashboard_summary failed, falling back to aggregate queries");
    }

    // Fallback: Aggregate Queries
    const [activeExchanges, myProducts, myNeeds] = await Promise.all([
      supabase.from("exchanges").select("*", { count: "exact", head: true }).or(`requester_id.eq.${userId},recipient_id.eq.${userId}`).in("status", ["pending", "accepted", "in_progress"]),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "published"),
      supabase.from("need_requests").select("*", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "open")
    ]);

    // Notifications (assuming table exists, if not default to 0)
    let unread_notifications = 0;
    try {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false);
      unread_notifications = count || 0;
    } catch {
      // Ignore if notifications table is missing
    }

    // Trust Score
    let trust_score = 0;
    try {
      const { data: profile } = await supabase.from("profiles").select("trust_score").eq("id", userId).single();
      trust_score = profile?.trust_score || 0;
    } catch {
      // Ignore
    }

    return {
      active_exchanges: activeExchanges.count || 0,
      my_products: myProducts.count || 0,
      my_needs: myNeeds.count || 0,
      unread_notifications,
      trust_score
    };
  },

  async getAdminKpiSummary() {
    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase.rpc('get_admin_kpi_summary');
      if (!error && data) return data;
    } catch (e) {
      console.warn("RPC get_admin_kpi_summary failed, falling back to aggregate queries");
    }

    // Fallback: Aggregate Queries
    const [users, products, exchanges, needRequests] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("exchanges").select("*", { count: "exact", head: true }),
      supabase.from("need_requests").select("*", { count: "exact", head: true })
    ]);

    return {
      total_users: users.count || 0,
      total_products: products.count || 0,
      total_exchanges: exchanges.count || 0,
      total_needs: needRequests.count || 0,
    };
  },

  async getPersonalAnalytics(userId: string) {
    // For now, doing separate counts, this can be moved to an RPC for efficiency later.
    const supabase = getSupabaseClient();
    
    const [publishedProducts, totalExchanges, totalNeeds] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "published"),
      supabase.from("exchanges").select("*", { count: "exact", head: true }).or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
      supabase.from("need_requests").select("*", { count: "exact", head: true }).eq("owner_id", userId)
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
