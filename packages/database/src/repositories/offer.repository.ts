import type { Offer } from "@reusedo/validation";
import { getSupabaseClient } from "../client";

export const OfferRepository = {
  async submitOffer(needId: string, userId: string, productId: string): Promise<Offer> {
    const supabase = getSupabaseClient();

    // Verify the product belongs to the user and is published
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("owner_id", userId)
      .eq("status", "published")
      .single();

    if (productError || !product) {
      throw new Error("Invalid product. You can only offer published products you own.");
    }

    const { data, error } = await supabase
      .from("offers")
      .insert({
        need_id: needId,
        user_id: userId,
        product_id: productId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already offered this product for this need.");
      }
      throw error;
    }

    // Update the offer_count on the need request safely via RPC or basic increment (omitted complex for foundation)
    
    return data;
  },

  async getOffersByNeedId(needId: string): Promise<Offer[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("need_id", needId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getMyOffers(userId: string): Promise<Offer[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }
};
