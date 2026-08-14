import { getSupabaseClient } from "./src/database/client";

async function check() {
  const supabase = getSupabaseClient(true);
  const { data, error } = await supabase.from('notifications').select('id').limit(1);
  console.log("Data:", data, "Error:", error);
}
check();
