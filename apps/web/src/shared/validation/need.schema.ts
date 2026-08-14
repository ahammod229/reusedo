import { z } from "zod";

export const needStatusSchema = z.enum([
  "draft",
  "published",
  "fulfilled",
  "expired",
  "archived",
  "deleted",
]);

export const createNeedSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: z.string().uuid("Invalid category ID"),
  preferred_condition: z.string().min(2, "Please select preferred condition"),
  district: z.string().min(2, "District is required"),
  upazila: z.string().min(2, "Upazila/Area is required"),
  preferred_brand: z.string().max(100).optional().nullable(),
  preferred_model: z.string().max(100).optional().nullable(),
  estimated_value: z.preprocess(
    (val) => (Number.isNaN(val) || val === "" ? undefined : Number(val)),
    z.number().positive().optional().nullable(),
  ),
  deadline: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().datetime().optional().nullable(),
  ),
  images: z.array(z.string().url("Must be a valid URL")).default([]),
});

export const updateNeedSchema = createNeedSchema.partial();

export type NeedStatus = z.infer<typeof needStatusSchema>;
export type CreateNeedData = z.infer<typeof createNeedSchema>;
export type UpdateNeedData = z.infer<typeof updateNeedSchema>;

export interface NeedRequest {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category_id: string;
  preferred_condition: string;
  district: string;
  upazila: string;
  preferred_brand?: string | null;
  preferred_model?: string | null;
  estimated_value?: number | null;
  deadline?: string | null;
  images: string[];
  status: NeedStatus;
  view_count: number;
  offer_count: number;
  created_at: string;
  updated_at: string;
}
