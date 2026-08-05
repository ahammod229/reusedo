import type { 
  Exchange, 
  ExchangeEvent, 
  CreateExchangeData, 
  CounterOfferData, 
  ExchangeStatus, 
  ExchangeEventType 
} from "@reusedo/validation";
import { getSupabaseClient } from "../client";

export const ExchangeRepository = {
  async createExchange(requesterId: string, payload: CreateExchangeData): Promise<Exchange> {
    const supabase = getSupabaseClient();
    
    // Create the exchange
    const { data: exchange, error: exchangeError } = await supabase
      .from("exchanges")
      .insert({
        requester_id: requesterId,
        recipient_id: payload.recipient_id,
        offered_product_ids: payload.offered_product_ids,
        requested_product_ids: payload.requested_product_ids,
        status: "pending"
      })
      .select()
      .single();

    if (exchangeError) throw exchangeError;

    // Create the timeline event
    const { error: eventError } = await supabase
      .from("exchange_events")
      .insert({
        exchange_id: exchange.id,
        actor_id: requesterId,
        action: "created",
        payload: {
          offered_product_ids: payload.offered_product_ids,
          requested_product_ids: payload.requested_product_ids
        }
      });

    if (eventError) throw eventError;

    return exchange;
  },

  async getExchangeById(id: string, userId: string): Promise<Exchange | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("id", id)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async getIncomingExchanges(userId: string): Promise<Exchange[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("recipient_id", userId)
      .in("status", ["pending", "counter_offered"])
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOutgoingExchanges(userId: string): Promise<Exchange[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("requester_id", userId)
      .in("status", ["pending", "counter_offered"])
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getExchangeHistory(userId: string): Promise<Exchange[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .in("status", ["accepted", "rejected", "cancelled", "expired", "ready_for_shipping"])
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getExchangeEvents(exchangeId: string): Promise<ExchangeEvent[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("exchange_events")
      .select("*")
      .eq("exchange_id", exchangeId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateExchangeStatus(id: string, actorId: string, status: ExchangeStatus, eventType: ExchangeEventType): Promise<Exchange> {
    const supabase = getSupabaseClient();
    
    const { data: exchange, error: updateError } = await supabase
      .from("exchanges")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: eventError } = await supabase
      .from("exchange_events")
      .insert({
        exchange_id: id,
        actor_id: actorId,
        action: eventType,
        payload: { previous_status: status } // Using payload loosely for non-product events
      });

    if (eventError) throw eventError;

    return exchange;
  },

  async counterOffer(id: string, actorId: string, payload: CounterOfferData): Promise<Exchange> {
    const supabase = getSupabaseClient();
    
    // In a counter offer, we update the product lists and set status to counter_offered
    const { data: exchange, error: updateError } = await supabase
      .from("exchanges")
      .update({
        offered_product_ids: payload.offered_product_ids,
        requested_product_ids: payload.requested_product_ids,
        status: "counter_offered",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: eventError } = await supabase
      .from("exchange_events")
      .insert({
        exchange_id: id,
        actor_id: actorId,
        action: "counter_offered",
        payload: {
          offered_product_ids: payload.offered_product_ids,
          requested_product_ids: payload.requested_product_ids
        }
      });

    if (eventError) throw eventError;

    return exchange;
  }
};
