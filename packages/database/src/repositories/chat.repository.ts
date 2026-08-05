import type {
  Message,
  CreateConversationData,
  SendMessageData
} from "@reusedo/validation";
import { getSupabaseClient } from "../client";

export const ChatRepository = {
  // ---------------------------------------------------------------------------
  // CONVERSATIONS
  // ---------------------------------------------------------------------------
  
  async getConversations(userId: string) {
    const supabase = getSupabaseClient();
    
    // We fetch conversations where the user is a participant.
    // In a real app with RLS, we'd just fetch from a view, but here we join manually.
    const { data: participantData, error: participantError } = await supabase
      .from("conversation_participants")
      .select(`
        *,
        conversation:conversations (
          *,
          participants:conversation_participants(*),
          messages(id, content, type, created_at, sender_id, status)
        )
      `)
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (participantError) throw participantError;
    
    // Extract conversations and map them
    // Sort by conversation updated_at
    const conversations = participantData
      .map(p => ({
        // @ts-ignore - Supabase type casting
        ...(p.conversation),
        my_participant_state: {
          archived: p.archived,
          muted: p.muted,
          unread_count: p.unread_count,
          last_read_message_id: p.last_read_message_id
        }
      }))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return conversations;
  },

  async getConversationById(id: string, userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        participants:conversation_participants(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    // Verify user is a participant
    // @ts-ignore - Supabase type casting
    const isParticipant = data.participants.some(p => p.user_id === userId);
    if (!isParticipant) return null;

    return data;
  },

  async createOrGetConversation(requesterId: string, payload: CreateConversationData) {
    const supabase = getSupabaseClient();
    
    // Check if conversation already exists for this context
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("context_type", payload.context_type)
      .eq("context_id", payload.context_id)
      .maybeSingle();
      
    if (existing) {
      return this.getConversationById(existing.id, requesterId);
    }

    // Create new conversation
    const { data: conversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        context_type: payload.context_type,
        context_id: payload.context_id
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add participants
    const participants = [
      { conversation_id: conversation.id, user_id: requesterId },
      { conversation_id: conversation.id, user_id: payload.participant_id }
    ];
    
    // Ensure unique participants (in case user talks to themselves)
    const uniqueParticipants = Array.from(new Map(participants.map(p => [p.user_id, p])).values());

    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert(uniqueParticipants);

    if (participantError) throw participantError;

    return this.getConversationById(conversation.id, requesterId);
  },
  
  async updateParticipantState(conversationId: string, userId: string, updates: Partial<{ archived: boolean, muted: boolean, unread_count: number, last_read_message_id: string }>) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("conversation_participants")
      .update(updates)
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
      
    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // MESSAGES
  // ---------------------------------------------------------------------------
  
  async getMessages(conversationId: string, limit = 50, beforeTimestamp?: string): Promise<Message[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("messages")
      .select(`
        *,
        reactions(*)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt("created_at", beforeTimestamp);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Return in chronological order (oldest first)
    return data.reverse() as Message[];
  },

  async sendMessage(conversationId: string, senderId: string, payload: SendMessageData): Promise<Message> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        type: payload.type,
        content: payload.content,
        metadata: payload.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    
    // Increment unread count for other participants
    // We use a small RPC or do it manually. Since we might not have an RPC setup:
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id, unread_count")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);
      
    if (participants) {
      for (const p of participants) {
        await supabase
          .from("conversation_participants")
          .update({ unread_count: p.unread_count + 1 })
          .eq("conversation_id", conversationId)
          .eq("user_id", p.user_id);
      }
    }

    return data as Message;
  },

  async markMessagesAsRead(conversationId: string, userId: string, messageId: string) {
    const supabase = getSupabaseClient();
    
    // Update participant read state
    await this.updateParticipantState(conversationId, userId, { 
      unread_count: 0,
      last_read_message_id: messageId
    });
    
    // Update messages status to read where delivered to this user (we simplify by just updating all sent/delivered in convo not from user)
    const { error } = await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .in("status", ["sent", "delivered"]);
      
    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // REACTIONS
  // ---------------------------------------------------------------------------

  async addReaction(messageId: string, userId: string, emoji: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("reactions")
      .upsert({
        message_id: messageId,
        user_id: userId,
        emoji
      }, { onConflict: "message_id,user_id" });
      
    if (error) throw error;
  },
  
  async removeReaction(messageId: string, userId: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
      
    if (error) throw error;
  }
};
