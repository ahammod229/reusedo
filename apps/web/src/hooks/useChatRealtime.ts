import type { Message } from "@reusedo/validation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "../providers/SocketProvider";

interface UseChatRealtimeProps {
  conversationId?: string;
  userId?: string;
}

export function useChatRealtime({ conversationId, userId }: UseChatRealtimeProps = {}) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Handle global notifications
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNotification = (payload: unknown) => {
      // Invalidate conversations list to refresh unread counts
      if ((payload as Record<string, unknown>).type === "new_message") {
        queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
        // Can also trigger a toast notification here
      }
    };

    socket.on("new_notification", handleNotification);

    return () => {
      socket.off("new_notification", handleNotification);
    };
  }, [socket, userId, queryClient]);

  // Handle specific conversation room messages
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join_conversation", conversationId);

    const handleNewMessage = (newMessage: Message) => {
      // Optimistically update the message cache
      queryClient.setQueryData(
        ["chat", "messages", conversationId],
        (oldData: Message[] | undefined) => {
          if (!oldData) return [newMessage];
          const exists = oldData.some((msg) => msg.id === newMessage.id);
          if (exists) return oldData;
          return [...oldData, newMessage];
        },
      );
      // Invalidate to ensure related data is fresh
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversation", conversationId] });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.emit("leave_conversation", conversationId);
    };
  }, [socket, conversationId, queryClient]);
}
