import { ChatRepository } from "@reusedo/database";
import { getSupabaseClient } from "@reusedo/database/src/client";
import { CreateConversationSchema, SendMessageSchema } from "@reusedo/validation";
import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middlewares/auth.middleware";
import { SocketService } from "../services/socket.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Ensure auth middleware is applied to all chat routes
router.use(requireAuth);

// -----------------------------------------------------------------------------
// CONVERSATIONS
// -----------------------------------------------------------------------------

// Get list of conversations for current user
router.get("/conversations", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const conversations = await ChatRepository.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Create or get conversation
router.post("/conversations", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const validatedData = CreateConversationSchema.parse(req.body);

    // Prevent talking to oneself unless strictly allowed (we'll allow it for now or rely on frontend validation)
    if (validatedData.participant_id === userId) {
      res.status(400).json({ error: "Cannot start a conversation with yourself." });
      return;
    }

    const conversation = await ChatRepository.createOrGetConversation(userId, validatedData);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

// Get conversation details by ID
router.get("/conversations/:id", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const conversation = await ChatRepository.getConversationById(req.params.id, userId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found or access denied." });
      return;
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// Archive conversation
router.post("/conversations/:id/archive", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const archiveStatus = req.body.archived ?? true;

    await ChatRepository.updateParticipantState(req.params.id, userId, { archived: archiveStatus });
    res.json({ success: true, archived: archiveStatus });
  } catch (error) {
    next(error);
  }
});

// Mute conversation
router.post("/conversations/:id/mute", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const muteStatus = req.body.muted ?? true;

    await ChatRepository.updateParticipantState(req.params.id, userId, { muted: muteStatus });
    res.json({ success: true, muted: muteStatus });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------
// MESSAGES
// -----------------------------------------------------------------------------

// Get messages for a conversation
router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;

    // Verify access
    const conversation = await ChatRepository.getConversationById(req.params.id, userId);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found or access denied." });
      return;
    }

    const limit = Number.parseInt(req.query.limit as string) || 50;
    const beforeTimestamp = req.query.before as string | undefined;

    const messages = await ChatRepository.getMessages(req.params.id, limit, beforeTimestamp);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Send a message
router.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;

    // Verify access
    const conversation = await ChatRepository.getConversationById(req.params.id, userId);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found or access denied." });
      return;
    }

    const validatedData = SendMessageSchema.parse(req.body);
    const message = await ChatRepository.sendMessage(req.params.id, userId, validatedData);

    // Emit real-time event to everyone in the conversation room
    SocketService.emitNewMessage(req.params.id, message);

    // Emit notification to other participants
    for (const p of conversation.participants) {
      if (p.user_id !== userId) {
        SocketService.emitNotification(p.user_id, {
          type: "new_message",
          title: "New Message",
          body: "You have a new message",
          link: `/chat/${conversation.id}`,
          created_at: new Date().toISOString()
        });
      }
    }
     res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// Mark messages as read
router.patch("/conversations/:id/read", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const { message_id } = req.body;

    if (!message_id) {
      res.status(400).json({ error: "message_id is required." });
      return;
    }

    await ChatRepository.markMessagesAsRead(req.params.id, userId, message_id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Upload attachment
router.post("/conversations/:id/attachments", upload.single("file"), async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const conversationId = req.params.id;

    // Verify access
    const conversation = await ChatRepository.getConversationById(conversationId, userId);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found or access denied." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    // Verify file type
    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Only image files are allowed." });
      return;
    }

    // Upload to Supabase Storage using service role key (or anon key if RLS allows)
    const supabase = getSupabaseClient(true); // Need service role to bypass RLS if bucket is restricted
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${conversationId}/${uuidv4()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat_attachments")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage.from("chat_attachments").getPublicUrl(fileName);

    // Create the message with the attachment URL
    const messageData = {
      type: "image" as const,
      content: "Image attachment", // Fallback text
      metadata: {
        url: urlData.publicUrl,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    };

    const message = await ChatRepository.sendMessage(conversationId, userId, messageData);

    // Emit real-time event to everyone in the conversation room
    SocketService.emitNewMessage(conversationId, message);

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------
// REACTIONS
// -----------------------------------------------------------------------------

router.post("/messages/:id/reactions", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const messageId = req.params.id;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: "Emoji is required." });
      return;
    }

    await ChatRepository.addReaction(messageId, userId, emoji);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/messages/:id/reactions", async (req, res, next) => {
  try {
    const userId = req.user?.profile?.id as string;
    const messageId = req.params.id;

    await ChatRepository.removeReaction(messageId, userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
