import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

// biome-ignore lint/complexity/noStaticOnlyClass: Service classes are used as namespaces
export class SocketService {
  private static io: SocketIOServer;
  // Map of userId to socketId
  private static userSockets: Map<string, string> = new Map();

  static initialize(httpServer: HTTPServer) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      "http://localhost:5173",
      "http://localhost:5174"
    ].filter(Boolean) as string[];

    SocketService.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      },
    });

    SocketService.io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // When a user authenticates with socket
      socket.on("authenticate", (userId: string) => {
        SocketService.userSockets.set(userId, socket.id);
        // Also join a room for their own ID so we can broadcast to all their devices
        socket.join(userId);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      });

      // Join a specific conversation room
      socket.on("join_conversation", (conversationId: string) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
      });

      // Leave a conversation room
      socket.on("leave_conversation", (conversationId: string) => {
        socket.leave(`conversation_${conversationId}`);
      });

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Remove user from tracking
        for (const [userId, socketId] of SocketService.userSockets.entries()) {
          if (socketId === socket.id) {
            SocketService.userSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  static getIO(): SocketIOServer {
    if (!SocketService.io) {
      throw new Error("Socket.io not initialized!");
    }
    return SocketService.io;
  }

  // Helper to send message to a specific conversation
  static emitNewMessage(conversationId: string, message: unknown) {
    if (SocketService.io) {
      SocketService.io.to(`conversation_${conversationId}`).emit("new_message", message);
    }
  }

  // Helper to send notification to a specific user
  static emitNotification(userId: string, notification: unknown) {
    if (SocketService.io) {
      // Send to the room representing the user's ID (covers all their connected sockets)
      SocketService.io.to(userId).emit("new_notification", notification);
    }
  }
}
