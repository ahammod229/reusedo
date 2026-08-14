import { z } from "zod";

export const createExchangeSchema = z.object({
  recipient_id: z.string().uuid("Invalid recipient ID"),
  offered_product_ids: z.array(z.string().uuid()).min(1, "You must offer at least one product"),
  requested_product_ids: z.array(z.string().uuid()).min(1, "You must request at least one product"),
});

export const counterOfferSchema = z.object({
  offered_product_ids: z.array(z.string().uuid()).min(1, "You must offer at least one product"),
  requested_product_ids: z.array(z.string().uuid()).min(1, "You must request at least one product"),
});

export type CreateExchangeData = z.infer<typeof createExchangeSchema>;
export type CounterOfferData = z.infer<typeof counterOfferSchema>;

export type ExchangeStatus = 
  | 'pending'
  | 'counter_offered'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'ready_for_shipping'
  | 'completed';

export type ExchangeEventType = 
  | 'created'
  | 'counter_offered'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface Exchange {
  id: string;
  requester_id: string;
  recipient_id: string;
  offered_product_ids: string[];
  requested_product_ids: string[];
  status: ExchangeStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ExchangeEvent {
  id: string;
  exchange_id: string;
  actor_id: string | null;
  action: ExchangeEventType;
  payload: Record<string, unknown>;
  created_at: string;
}
