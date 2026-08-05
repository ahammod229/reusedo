import { z } from "zod";

export const MessageTypeSchema = z.enum([
  "text",
  "image",
  "system",
  "product_card",
  "need_card",
  "exchange_card"
]);
export type MessageType = z.infer<typeof MessageTypeSchema>;

export const MessageStatusSchema = z.enum(["sent", "delivered", "read"]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const ContextTypeSchema = z.enum(["product", "need", "exchange", "donation"]);
export type ContextType = z.infer<typeof ContextTypeSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  context_type: ContextTypeSchema,
  context_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationParticipantSchema = z.object({
  conversation_id: z.string().uuid(),
  user_id: z.string(),
  archived: z.boolean(),
  muted: z.boolean(),
  unread_count: z.number().int().min(0),
  last_read_message_id: z.string().uuid().nullable(),
  joined_at: z.string().datetime()
});
export type ConversationParticipant = z.infer<typeof ConversationParticipantSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().nullable(), // nullable for system messages
  type: MessageTypeSchema,
  content: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).nullable(),
  status: MessageStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable()
});
export type Message = z.infer<typeof MessageSchema>;

export const ReactionSchema = z.object({
  message_id: z.string().uuid(),
  user_id: z.string(),
  emoji: z.string(),
  created_at: z.string().datetime()
});
export type Reaction = z.infer<typeof ReactionSchema>;

export const CreateConversationSchema = z.object({
  context_type: ContextTypeSchema,
  context_id: z.string().uuid(),
  participant_id: z.string() // The user the current user wants to talk to
});
export type CreateConversationData = z.infer<typeof CreateConversationSchema>;

export const SendMessageSchema = z.object({
  type: MessageTypeSchema,
  content: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).nullable().optional()
});
export type SendMessageData = z.infer<typeof SendMessageSchema>;
