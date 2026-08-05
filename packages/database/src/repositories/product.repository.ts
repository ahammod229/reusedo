import type { CreateProductData, Product, UpdateProductData } from "@reusedo/validation";
import { getSupabaseClient } from "../client";

export const ProductRepository = {
  async getProducts(filters?: {
    category_id?: string;
    district?: string;
    status?: string;
  }): Promise<Product[]> {
    const supabase = getSupabaseClient();
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });

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

  async getMyProducts(ownerId: string, status?: string): Promise<Product[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("products")
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

  async getProductById(id: string): Promise<Product | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async createProduct(
    ownerId: string,
    payload: CreateProductData,
    status = "draft",
  ): Promise<Product> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
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

  async updateProduct(id: string, ownerId: string, updates: UpdateProductData): Promise<Product> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
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

  async deleteProduct(id: string, ownerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("products").delete().eq("id", id).eq("owner_id", ownerId);

    if (error) throw error;
  },

  async incrementViewCount(_id: string): Promise<void> {
    // Optional: Call an RPC or do a simple update if it doesn't need to be strictly atomic.
    // For this iteration, we'll skip complex atomic updates since it's a foundation.
  },
};
