import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "../providers/SocketProvider";

export function useNotificationRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!userId || !socket) return;

    const handleNotification = () => {
      // Invalidate the generic list queries so they refetch the correct page/order
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notification_count"] });
    };

    socket.on("new_notification", handleNotification);

    return () => {
      socket.off("new_notification", handleNotification);
    };
  }, [userId, socket, queryClient]);
}
