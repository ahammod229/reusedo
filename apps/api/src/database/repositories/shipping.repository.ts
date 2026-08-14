import { getSupabaseClient } from "../client";

export interface Shipment {
  id: string;
  exchange_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';
  tracking_number?: string;
  carrier?: string;
  estimated_delivery_date?: string;
  shipping_address: Record<string, unknown>;
  shipping_cost: number;
  created_at: string;
  updated_at: string;
}

export const ShippingRepository = {
  async createShipment(data: {
    exchange_id: string;
    sender_id: string;
    receiver_id: string;
    shipping_address: Record<string, unknown>;
  }): Promise<Shipment> {
    const supabase = getSupabaseClient();
    const { data: shipment, error } = await supabase
      .from("shipments")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return shipment;
  },

  async getShipment(id: string): Promise<Shipment | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async getShipmentByExchange(exchangeId: string): Promise<Shipment | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("exchange_id", exchangeId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async getUserShipments(userId: string): Promise<Shipment[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateShipment(
    id: string,
    data: Partial<Omit<Shipment, "id" | "created_at" | "updated_at">>
  ): Promise<Shipment> {
    const supabase = getSupabaseClient();
    const { data: shipment, error } = await supabase
      .from("shipments")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return shipment;
  }
};
