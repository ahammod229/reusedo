import { z } from "zod";

export const submitOfferSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
});

export type SubmitOfferData = z.infer<typeof submitOfferSchema>;

export interface Offer {
  id: string;
  need_id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
}
