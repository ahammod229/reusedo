import { AuthService, useAuthStore } from "@/features/auth";
import { USE_MOCK } from "@/features/data/mode";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// VITE_API_URL points at ".../api"; socket.io would read that path as a namespace, so connect to the origin only.
const socketOrigin = () => {
  try {
    return new URL(import.meta.env.VITE_API_URL || "http://localhost:8080/api").origin;
  } catch {
    return "http://localhost:8080";
  }
};

/** One connection per signed-in user; pushes from the server refresh the affected lists. */
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const uid = useAuthStore((state) => state.user?.uid);
  const qc = useQueryClient();

  useEffect(() => {
    // Mock data has no server to listen to.
    if (!uid || USE_MOCK) return;

    // The server verifies this Firebase token on every connect; it ignores any user id we might send.
    const s = io(socketOrigin(), {
      transports: ["websocket", "polling"],
      auth: (cb) => {
        AuthService.getIdToken().then((token) => cb({ token }));
      },
    });
    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));
    s.on("new_message", () => {
      qc.invalidateQueries({ queryKey: ["chats"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    });
    s.on("new_notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["courier-view"] });
    });
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [uid, qc]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
