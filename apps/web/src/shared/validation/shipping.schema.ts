import { z } from "zod";

export const createShipmentSchema = z.object({
  exchange_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  shipping_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
});

export const updateShipmentSchema = z.object({
  status: z
    .enum(["pending", "processing", "shipped", "in_transit", "delivered", "cancelled", "returned"])
    .optional(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  estimated_delivery_date: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
