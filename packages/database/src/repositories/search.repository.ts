import type { 
  SavedSearch, 
  CreateSavedSearchData, 
  SearchFilters,
  RecentlyViewed
} from "@reusedo/validation";
import { getSupabaseClient } from "../client";
import type { Product, NeedRequest as Need, UserProfile } from "@reusedo/validation";

export const SearchRepository = {
  // Global Search (Multi-table fallback if complex FTS queries aren't enough)
  
  async searchProducts(filters: SearchFilters): Promise<{ data: Product[], count: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from("products").select("*", { count: "exact" });

    // Text search
    if (filters.q) {
      // Use websearch_to_tsquery for simple google-like syntax handling
      query = query.textSearch('fts_tsvector', filters.q, { config: 'english' });
    }

    // Exact matches
    if (filters.category) query = query.eq('category_id', filters.category);
    if (filters.subcategory) query = query.eq('subcategory_id', filters.subcategory);
    if (filters.condition) query = query.eq('condition', filters.condition);
    if (filters.district) query = query.eq('district', filters.district);
    if (filters.upazila) query = query.eq('upazila', filters.upazila);
    
    // Default active filter
    query = query.eq('status', 'available');

    // Sorting
    if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (filters.sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (filters.sortBy === 'alphabetical') query = query.order('title', { ascending: true });
    else {
      // Default / 'relevant' is usually handled by ts_rank in raw SQL, 
      // but via Supabase Data API we might just fallback to newest if not explicitly sorted
      // or if using FTS, it's somewhat sorted by rank natively? 
      // Actually Supabase textSearch doesn't auto-sort by rank without a custom RPC.
      // We'll default to newest for now.
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data as Product[], count: count || 0 };
  },

  async searchNeeds(filters: SearchFilters): Promise<{ data: Need[], count: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from("needs").select("*", { count: "exact" });

    if (filters.q) {
      query = query.textSearch('fts_tsvector', filters.q, { config: 'english' });
    }

    if (filters.category) query = query.eq('category_id', filters.category);
    if (filters.district) query = query.eq('district', filters.district);
    if (filters.urgency) query = query.eq('urgency', filters.urgency);
    
    query = query.eq('status', 'open');

    if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (filters.sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data as Need[], count: count || 0 };
  },

  async searchUsers(filters: SearchFilters): Promise<{ data: UserProfile[], count: number }> {
    const supabase = getSupabaseClient();
    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (filters.q) {
      // Trigram matching via ilike for standard API access (or rpc if needed)
      query = query.or(`display_name.ilike.%${filters.q}%,username.ilike.%${filters.q}%`);
    }

    if (filters.verified) query = query.eq('is_verified', true);
    
    // Sort logic
    if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('trust_score', { ascending: false });

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data as UserProfile[], count: count || 0 };
  },

  // Saved Searches
  async saveSearch(userId: string, data: CreateSavedSearchData): Promise<SavedSearch> {
    const supabase = getSupabaseClient();
    const { data: saved, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: userId,
        name: data.name,
        query: data.query,
        filters: data.filters,
        type: data.type
      })
      .select()
      .single();
    if (error) throw error;
    return saved;
  },

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteSavedSearch(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  },

  // Recently Viewed
  async logRecentlyViewed(userId: string, itemType: string, itemId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("recently_viewed")
      .upsert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,item_type,item_id'
      });
    if (error) throw error;
  },

  async getRecentlyViewed(userId: string, limit = 10): Promise<RecentlyViewed[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("recently_viewed")
      .select("*")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  // Recommendations Heuristic (Similar Products)
  async getSimilarProducts(productId: string, categoryId: string, limit = 5): Promise<Product[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .neq("id", productId)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Product[];
  },

  // Recommended Products for User based on recent views
  async getRecommendedProducts(userId: string, limit = 10): Promise<Product[]> {
    const supabase = getSupabaseClient();
    // 1. Get user's recent product views
    const { data: recentViews } = await supabase
      .from("recently_viewed")
      .select("item_id")
      .eq("user_id", userId)
      .eq("item_type", "product")
      .order("viewed_at", { ascending: false })
      .limit(5);

    if (recentViews && recentViews.length > 0) {
      // Fetch categories of these products
      const productIds = recentViews.map(v => v.item_id);
      const { data: products } = await supabase
        .from("products")
        .select("category_id")
        .in("id", productIds);
      
      const categoryIds = products?.map(p => p.category_id).filter(Boolean) || [];
      if (categoryIds.length > 0) {
        // Recommend products from these categories
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .in("category_id", categoryIds)
          .eq("status", "available")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (!error && data) return data as Product[];
      }
    }
    
    // Fallback: Return newest products
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Product[];
  }
};
