/// <reference types="node" />
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

let supabaseAnonInstance: SupabaseClient | null = null;
let supabaseServiceRoleInstance: SupabaseClient | null = null;

export const getSupabaseClient = (useServiceRole = true): SupabaseClient => {
  if (useServiceRole && supabaseServiceRoleInstance) return supabaseServiceRoleInstance;
  if (!useServiceRole && supabaseAnonInstance) return supabaseAnonInstance;

  // The Vercel Supabase integration names its variables with a "reusedo_" prefix.
  const env = process.env;
  const supabaseUrl = env.SUPABASE_URL ?? env.reusedo_SUPABASE_URL;
  const supabaseKey = useServiceRole
    ? (env.SUPABASE_SERVICE_ROLE_KEY ?? env.reusedo_SUPABASE_SERVICE_ROLE_KEY)
    : (env.SUPABASE_ANON_KEY ?? env.reusedo_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase URL and ${useServiceRole ? "Service Role" : "Anon"} Key must be defined in environment variables.`,
    );
  }

  const client = createClient(supabaseUrl, supabaseKey);

  if (useServiceRole) {
    supabaseServiceRoleInstance = client;
  } else {
    supabaseAnonInstance = client;
  }

  return client;
};
