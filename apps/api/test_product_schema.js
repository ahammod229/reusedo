const { z } = require("zod");

const createProductSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  category_id: z.string().uuid(),
  condition: z.string(),
  exchange_preference: z.string(),
  district: z.string(),
  upazila: z.string(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  purchase_year: z.number().int().min(1900).optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([])
});

const res = createProductSchema.safeParse({
  title: "iPhone",
  description: "Good phone for exchange",
  category_id: "00000000-0000-0000-0000-000000000000",
  condition: "Good",
  exchange_preference: "Cash or phone",
  district: "Dhaka",
  upazila: "Gulshan",
  brand: "",
  model: "",
  color: "",
  purchase_year: NaN,
  estimated_value: NaN,
  images: [],
  tags: []
});
console.log(res.error ? res.error.issues : res.data);
