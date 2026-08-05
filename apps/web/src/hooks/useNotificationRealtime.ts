import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "./useChatRealtime";

export function useNotificationRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    if (!supabase) return;

    const channel = supabase.channel(`notifications:user:${userId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (_payload) => {
          // Invalidate the generic list queries so they refetch the correct page/order
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notification_count"] });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to realtime notifications");
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
