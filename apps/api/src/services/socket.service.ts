import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { adminAuth } from "../config/firebase-admin";
import { ChatRepository, UserRepository } from "../database";

// biome-ignore lint/complexity/noStaticOnlyClass: Service classes are used as namespaces
export class SocketService {
  private static io: SocketIOServer;

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

    // Every socket must present a valid Firebase ID token. The rooms it may join
    // come from that verified identity, never from ids the client sends.
    SocketService.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (typeof token !== "string") return next(new Error("unauthorized"));
        const decoded = await adminAuth.verifyIdToken(token);
        const profile = await UserRepository.getProfileByUid(decoded.uid);
        if (!profile) return next(new Error("unauthorized"));
        socket.data.userId = profile.id;
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });

    SocketService.io.on("connection", (socket) => {
      const userId = socket.data.userId as string;
      // One room per user covers all of their open tabs and devices.
      socket.join(userId);

      socket.on("join_conversation", async (conversationId: unknown) => {
        if (typeof conversationId !== "string") return;
        try {
          // Returns null unless this user is a participant of the conversation.
          const conversation = await ChatRepository.getConversationById(conversationId, userId);
          if (!conversation) return socket.emit("error_message", "not_allowed");
          socket.join(`conversation_${conversationId}`);
        } catch {
          socket.emit("error_message", "not_allowed");
        }
      });

      socket.on("leave_conversation", (conversationId: unknown) => {
        if (typeof conversationId === "string") socket.leave(`conversation_${conversationId}`);
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
