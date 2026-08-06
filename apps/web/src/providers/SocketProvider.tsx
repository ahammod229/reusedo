import { useAuthStore } from "@reusedo/auth";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

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

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:8080", {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("authenticate", user.uid);
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
