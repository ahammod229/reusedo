import type { Message } from "@reusedo/validation";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize Supabase client for realtime only
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface UseChatRealtimeProps {
  conversationId?: string;
  userId?: string;
}

export function useChatRealtime({ conversationId, userId }: UseChatRealtimeProps = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase || !userId) return;

    // 1. Subscribe to Conversation updates (e.g. unread count changes) for the current user
    const participantsChannel = supabase
      .channel(`public:conversation_participants:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${userId}`,
        },
        (_payload) => {
          // Invalidate conversations list to refresh unread counts
          queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
    };
  }, [userId, queryClient]);

  useEffect(() => {
    if (!supabase || !conversationId) return;

    // 2. Subscribe to Messages within a specific conversation
    const messagesChannel = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Optimistically update the message cache
          queryClient.setQueryData(
            ["chat", "messages", conversationId],
            (oldData: Message[] | undefined) => {
              if (!oldData) return [newMessage];

              // Check if we already have this message (e.g., from optimistic update during sending)
              const exists = oldData.some((msg) => msg.id === newMessage.id);
              if (exists) return oldData;

              // Prepend new message to the list (assuming chronological order in cache)
              return [...oldData, newMessage];
            },
          );

          // Also invalidate to ensure related data (like reactions) is fresh
          queryClient.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;

          queryClient.setQueryData(
            ["chat", "messages", conversationId],
            (oldData: Message[] | undefined) => {
              if (!oldData) return [updatedMessage];
              return oldData.map((msg) =>
                msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg,
              );
            },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [conversationId, queryClient]);
}
