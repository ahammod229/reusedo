import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  parent_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const productStatusSchema = z.enum(["draft", "published", "archived", "hidden", "deleted"]);

export const productSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(150, "Title must be less than 150 characters"),
  description: z.string().min(1, "Description is required").max(5000, "Description must be less than 5000 characters"),
  category_id: z.string().uuid("Invalid category"),
  condition: z.string().min(1, "Condition is required"),
  exchange_preference: z.string().min(1, "Exchange preference is required"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().min(1, "Upazila is required"),
  images: z.array(z.string().url("Must be a valid image URL")).default([]),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  purchase_year: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  status: productStatusSchema,
  view_count: z.number().int().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Product = z.infer<typeof productSchema>;

export const createProductSchema = productSchema.omit({
  id: true,
  owner_id: true,
  status: true,
  view_count: true,
  created_at: true,
  updated_at: true,
});

export type CreateProductData = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  status: productStatusSchema.optional(),
});

export type UpdateProductData = z.infer<typeof updateProductSchema>;
