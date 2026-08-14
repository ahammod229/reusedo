import { getSupabaseClient } from "../client";
import type { AdminRole, CMSPageData, FeatureFlagData } from "../../shared/validation";

export const AdminRepository = {
  // Users
  async getUsers(page = 1, limit = 20, search?: string) {
    const supabase = getSupabaseClient(true);
    let query = supabase.from("profiles").select("*", { count: "exact" });
    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,firebase_uid.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { users: data, total: count || 0 };
  },

  async getProducts(page = 1, limit = 20, search?: string) {
    const supabase = getSupabaseClient(true);
    let query = supabase.from("products").select("*, owner:profiles!products_owner_id_fkey(username, display_name)", { count: "exact" });
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { products: data, total: count || 0 };
  },

  async updateProductStatus(productId: string, status: string, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select()
      .single();
    if (error) throw error;
    await AdminRepository.createAuditLog(adminId, "UPDATE_PRODUCT_STATUS", "product", productId, null, { status });
    return data;
  },

  async deleteProduct(productId: string, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) throw error;
    await AdminRepository.createAuditLog(adminId, "DELETE_PRODUCT", "product", productId, null, null);
  },

  async getNeeds(page = 1, limit = 20, search?: string) {
    const supabase = getSupabaseClient(true);
    let query = supabase.from("need_requests").select("*, owner:profiles!need_requests_owner_id_fkey(username, display_name)", { count: "exact" });
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { needs: data, total: count || 0 };
  },

  async updateNeedStatus(needId: string, status: string, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("need_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", needId)
      .select()
      .single();
    if (error) throw error;
    await AdminRepository.createAuditLog(adminId, "UPDATE_NEED_STATUS", "need", needId, null, { status });
    return data;
  },

  async deleteNeed(needId: string, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from("need_requests").delete().eq("id", needId);
    if (error) throw error;
    await AdminRepository.createAuditLog(adminId, "DELETE_NEED", "need", needId, null, null);
  },

  async getExchanges(page = 1, limit = 20, search?: string) {
    const supabase = getSupabaseClient(true);
    let query = supabase.from("exchanges").select("*, requester:profiles!exchanges_requester_id_fkey(username, display_name), recipient:profiles!exchanges_recipient_id_fkey(username, display_name)", { count: "exact" });
    
    // Simplistic search on status for now since ID is UUID
    if (search) {
      query = query.ilike("status", `%${search}%`);
    }
    
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { exchanges: data, total: count || 0 };
  },

  async updateExchangeStatus(exchangeId: string, status: string, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("exchanges")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", exchangeId)
      .select()
      .single();
    if (error) throw error;
    await AdminRepository.createAuditLog(adminId, "UPDATE_EXCHANGE_STATUS", "exchange", exchangeId, null, { status });
    return data;
  },

  async getShipments(page = 1, limit = 20, search?: string) {
    const supabase = getSupabaseClient(true);
    let query = supabase.from("shipments").select("*, sender:profiles!shipments_sender_id_fkey(username, display_name), receiver:profiles!shipments_receiver_id_fkey(username, display_name)", { count: "exact" });
    
    if (search) {
      query = query.ilike("status", `%${search}%`);
    }
    
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { shipments: data, total: count || 0 };
  },

  async updateShipmentStatus(shipmentId: string, status: string, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("shipments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", shipmentId)
      .select()
      .single();
    if (error) throw error;
    await AdminRepository.createAuditLog(adminId, "UPDATE_SHIPMENT_STATUS", "shipment", shipmentId, null, { status });
    return data;
  },

  async updateUserRole(userId: string, role: AdminRole | null) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ admin_role: role })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Audit Logs
  async createAuditLog(adminId: string, action: string, entityType: string, entityId?: string, previousValue?: unknown, newValue?: unknown, ipAddress?: string, userAgent?: string) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("audit_logs").insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      previous_value: previousValue,
      new_value: newValue,
      ip_address: ipAddress,
      user_agent: userAgent
    }).select().single();
    if (error) throw error;
    return data;
  },

  async getAuditLogs(page = 1, limit = 50) {
    const supabase = getSupabaseClient(true);
    const { data, error, count } = await supabase
      .from("audit_logs")
      .select(`
        *,
        admin:profiles!audit_logs_admin_id_fkey(username, display_name)
      `, { count: "exact" })
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { logs: data, total: count || 0 };
  },

  // CMS
  async getCMSPages() {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("cms_pages").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createCMSPage(pageData: Partial<CMSPageData> & { author_id: string }) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("cms_pages").insert(pageData).select().single();
    if (error) throw error;
    return data;
  },

  async updateCMSPage(slug: string, pageData: Partial<CMSPageData>) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("cms_pages").update({ ...pageData, updated_at: new Date().toISOString() }).eq("slug", slug).select().single();
    if (error) throw error;
    return data;
  },

  // Feature Flags
  async getFeatureFlags() {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("feature_flags").select("*").order("key", { ascending: true });
    if (error) throw error;
    return data;
  },
  
  async updateFeatureFlag(key: string, updates: Partial<FeatureFlagData>, adminId: string) {
    const supabase = getSupabaseClient(true);
    // Try to update existing, or insert if not exists (upsert)
    const { data, error } = await supabase.from("feature_flags").upsert({
      key,
      ...updates,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" }).select().single();
    if (error) throw error;
    return data;
  },

  // Settings
  async getPlatformSettings() {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("platform_settings").select("*");
    if (error) throw error;
    // Map to a dictionary
    return data.reduce((acc: Record<string, unknown>, row: { key: string; value: unknown }) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },

  async updatePlatformSetting(key: string, value: unknown, adminId: string) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase.from("platform_settings").upsert({
      key,
      value,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" }).select().single();
    if (error) throw error;
    return data;
  },

  // Metrics (Dashboard Analytics)
  async getDashboardMetrics() {
    const supabase = getSupabaseClient(true);
    // For simplicity, we just count some tables
    const [
      users,
      products,
      exchanges,
      reports
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("exchanges").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending")
    ]);
    
    return {
      totalUsers: users.count || 0,
      activeProducts: products.count || 0,
      totalExchanges: exchanges.count || 0,
      pendingReports: reports.count || 0,
    };
  }
};
