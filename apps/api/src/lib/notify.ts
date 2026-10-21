import { getSupabaseClient } from "../database/client";
import { SocketService } from "../services/socket.service";

export type NotificationKind = "request" | "accepted" | "message" | "courier" | "match" | "review";

/** Stores a notification and pushes it to the person's open tabs. Never fails the caller. */
export async function notify(userId: string, kind: NotificationKind, text: string, href: string) {
  try {
    const { data } = await getSupabaseClient()
      .from("notifications")
      .insert({ user_id: userId, kind, text, href })
      .select("id, kind, text, href, is_read, created_at")
      .single();
    if (data) SocketService.emitNotification(userId, data);
  } catch (e) {
    console.error("notify failed", e);
  }
}
