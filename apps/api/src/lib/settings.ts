import { getSupabaseClient } from "../database/client";
import { must } from "./http";

export interface GeneralSettings {
  supportEmail: string;
  aiDailyLimit: number;
  maxPhotos: number;
  requestExpiryDays: number;
  maintenanceMode: boolean;
}

// Settings change rarely and are read on hot paths (posting, feed ads): cache briefly.
const TTL_MS = 30_000;
const cache = new Map<string, { value: unknown; at: number }>();

export async function getSetting<T>(key: string): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const row = must(
    await getSupabaseClient().from("platform_settings").select("value").eq("key", key).single(),
  ) as { value: T };
  cache.set(key, { value: row.value, at: Date.now() });
  return row.value;
}

export async function saveSetting(key: string, value: unknown, by: string) {
  must(
    await getSupabaseClient()
      .from("platform_settings")
      .upsert({ key, value, updated_by: by, updated_at: new Date().toISOString() }),
  );
  cache.delete(key);
}

export async function flagOn(key: string): Promise<boolean> {
  const hit = cache.get(`flag:${key}`);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as boolean;
  const { data } = await getSupabaseClient()
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .maybeSingle();
  const on = data?.enabled ?? false;
  cache.set(`flag:${key}`, { value: on, at: Date.now() });
  return on;
}

export const forgetFlag = (key: string) => cache.delete(`flag:${key}`);
