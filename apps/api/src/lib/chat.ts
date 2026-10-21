import { z } from "zod";
import { getSupabaseClient } from "../database/client";

/** Whether this user takes part in the conversation; everything else answers 404. */
export async function isParticipant(conversationId: string, userId: string) {
  if (!z.string().uuid().safeParse(conversationId).success) return false;
  const { count } = await getSupabaseClient()
    .from("conversation_participants")
    .select("user_id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}
