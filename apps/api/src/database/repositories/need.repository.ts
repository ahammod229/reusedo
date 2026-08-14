import type { CreateNeedData, NeedRequest, UpdateNeedData } from "../../shared/validation";
import { getSupabaseClient } from "../client";

export const NeedRepository = {
  async getNeeds(filters?: {
    category_id?: string;
    district?: string;
    status?: string;
  }): Promise<NeedRequest[]> {
    const supabase = getSupabaseClient();
    let query = supabase.from("need_requests").select("*").order("created_at", { ascending: false });

    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters?.district) {
      query = query.eq("district", filters.district);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    } else {
      query = query.eq("status", "published");
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getMyNeeds(ownerId: string, status?: string): Promise<NeedRequest[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("need_requests")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getNeedById(id: string): Promise<NeedRequest | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("need_requests").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async createNeed(
    ownerId: string,
    payload: CreateNeedData,
    status = "draft",
  ): Promise<NeedRequest> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("need_requests")
      .insert({
        ...payload,
        owner_id: ownerId,
        status,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNeed(id: string, ownerId: string, updates: UpdateNeedData & { status?: string }): Promise<NeedRequest> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("need_requests")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNeed(id: string, ownerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("need_requests").delete().eq("id", id).eq("owner_id", ownerId);

    if (error) throw error;
  },
};
