import { createClient } from "npm:@supabase/supabase-js@2";
import { env } from "./http.ts";

/** Service-role client: bypasses RLS. Only ever used inside Edge Functions, never sent to a browser. */
export const serviceClient = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
