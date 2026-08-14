const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.storage.createBucket('product_images', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'],
    fileSizeLimit: 5242880
  });
  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log("Bucket 'product_images' already exists.");
    } else {
      console.error("Error creating product_images bucket:", error);
    }
  } else {
    console.log("Bucket product_images created successfully.");
  }
  
  const res2 = await supabase.storage.createBucket('profile_images', { public: true });
  if (res2.error) console.log("profile_images:", res2.error.message);
  else console.log("profile_images created");
}
main();
