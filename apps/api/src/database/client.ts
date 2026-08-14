/// <reference types="node" />
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

let supabaseAnonInstance: SupabaseClient | null = null;
let supabaseServiceRoleInstance: SupabaseClient | null = null;

export const getSupabaseClient = (useServiceRole = true): SupabaseClient => {
  if (useServiceRole && supabaseServiceRoleInstance) return supabaseServiceRoleInstance;
  if (!useServiceRole && supabaseAnonInstance) return supabaseAnonInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Supabase URL and ${useServiceRole ? 'Service Role' : 'Anon'} Key must be defined in environment variables.`);
  }

  const client = createClient(supabaseUrl, supabaseKey);

  if (useServiceRole) {
    supabaseServiceRoleInstance = client;
  } else {
    supabaseAnonInstance = client;
  }

  return client;
};
