const { z } = require("zod");

const createNeedSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: z.string().uuid("Invalid category ID"),
  preferred_condition: z.string().min(2, "Please select preferred condition"),
  district: z.string().min(2, "District is required"),
  upazila: z.string().min(2, "Upazila/Area is required"),
  preferred_brand: z.string().max(100).optional().nullable(),
  preferred_model: z.string().max(100).optional().nullable(),
  estimated_value: z.number().positive().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  images: z.array(z.string().url("Must be a valid URL")).default([]),
});

const res = createNeedSchema.safeParse({
  title: "Looking for a phone",
  description: "Must be in good condition",
  category_id: "00000000-0000-0000-0000-000000000000",
  preferred_condition: "Good",
  district: "Dhaka",
  upazila: "Gulshan",
  preferred_brand: "",
  preferred_model: "",
  estimated_value: NaN,
  deadline: "",
  images: []
});
console.log(res.error ? res.error.issues : res.data);
