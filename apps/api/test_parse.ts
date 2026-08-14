import { createNeedSchema } from "./src/shared/validation/need.schema.ts";
import { createProductSchema } from "./src/shared/validation/product.schema.ts";

const needRes = createNeedSchema.safeParse({
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

const prodRes = createProductSchema.safeParse({
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

console.log("Need:", needRes.error ? needRes.error.issues : needRes.data);
console.log("Prod:", prodRes.error ? prodRes.error.issues : prodRes.data);
