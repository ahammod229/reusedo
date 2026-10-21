import { getSupabaseClient } from "../database/client";

/** Every admin action is written here; the audit screen reads it back. */
export async function audit(actorId: string, action: string, target: string, details?: unknown) {
  const { error } = await getSupabaseClient()
    .from("audit_logs")
    .insert({ actor_id: actorId, action, target, details: details ?? null });
  if (error) console.error("audit failed", error);
}
