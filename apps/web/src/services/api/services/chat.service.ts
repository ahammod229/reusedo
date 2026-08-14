import type {
  Conversation,
  CreateConversationData,
  Message,
  SendMessageData,
} from "@/shared/validation";
import { apiClient } from "../index";

export const ChatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>("/chat/conversations");
    return response.data;
  },

  async createConversation(data: CreateConversationData): Promise<Conversation> {
    const response = await apiClient.post<Conversation>("/chat/conversations", data);
    return response.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/chat/conversations/${id}`);
    return response.data;
  },

  async archiveConversation(id: string, archived = true): Promise<void> {
    await apiClient.post(`/chat/conversations/${id}/archive`, { archived });
  },

  async muteConversation(id: string, muted = true): Promise<void> {
    await apiClient.post(`/chat/conversations/${id}/mute`, { muted });
  },

  async getMessages(conversationId: string, limit = 50, before?: string): Promise<Message[]> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (before) params.append("before", before);

    const response = await apiClient.get<Message[]>(
      `/chat/conversations/${conversationId}/messages?${params.toString()}`,
    );
    return response.data;
  },

  async sendMessage(conversationId: string, data: SendMessageData): Promise<Message> {
    const response = await apiClient.post<Message>(
      `/chat/conversations/${conversationId}/messages`,
      data,
    );
    return response.data;
  },

  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    await apiClient.patch(`/chat/conversations/${conversationId}/read`, { message_id: messageId });
  },

  async uploadAttachment(conversationId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<Message>(
      `/chat/conversations/${conversationId}/attachments`,
      formData,
    );
    return response.data;
  },

  async addReaction(messageId: string, emoji: string): Promise<void> {
    await apiClient.post(`/chat/messages/${messageId}/reactions`, { emoji });
  },

  async removeReaction(messageId: string): Promise<void> {
    await apiClient.delete(`/chat/messages/${messageId}/reactions`);
  },
};
