import { AuthService, useAuthStore } from "@/features/auth";
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

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socket) return;

    // The server verifies this Firebase token on every connect; it ignores any user id we might send.
    const newSocket = io(socketOrigin(), {
      transports: ["websocket", "polling"],
      auth: (cb) => {
        AuthService.getIdToken().then((token) => cb({ token }));
      },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
