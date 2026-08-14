const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: "apps/api/.env" });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.storage.createBucket('product_images', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'],
    fileSizeLimit: 5242880 // 5MB
  });
  if (error) {
    if (error.message.includes('already exists')) {
      console.log("Bucket 'product_images' already exists.");
    } else {
      console.error("Error creating bucket:", error);
    }
  } else {
    console.log("Bucket created successfully:", data);
  }
}
main();
