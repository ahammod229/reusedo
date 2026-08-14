import type { Category } from "../../shared/validation";
import { getSupabaseClient } from "../client";

export const CategoryRepository = {
  async getCategories(): Promise<Category[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },
};
