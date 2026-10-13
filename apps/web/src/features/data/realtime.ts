import { useAuthStore } from "@/features/auth";
import { supabase } from "@/services/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { keys } from "./hooks";
import { USE_MOCK } from "./source";

/**
 * Live updates: when a message or notification arrives, refresh the lists. Supabase Realtime applies the same
 * row-level-security rules as normal reads, so a person only ever receives their own chats and notifications.
 */
export function useRealtimeSync() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const signedIn = !!user?.emailVerified;

  useEffect(() => {
    if (USE_MOCK || !signedIn) return;
    const channel = supabase()
      .channel("me")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: keys.chats });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: keys.notifications });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "exchanges" }, () => {
        qc.invalidateQueries({ queryKey: keys.exchanges });
      })
      .subscribe();
    return () => {
      supabase().removeChannel(channel);
    };
  }, [qc, signedIn]);
}
