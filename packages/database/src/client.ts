/// <reference types="node" />
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (useServiceRole = false): SupabaseClient => {
  if (supabaseInstance && !useServiceRole) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (useServiceRole) {
    supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key must be defined in environment variables.");
  }

  const client = createClient(supabaseUrl, supabaseKey);

  if (!useServiceRole) {
    supabaseInstance = client;
  }

  return client;
};
