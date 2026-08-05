import { ChatService } from "@reusedo/api-client";
import { useAuthStore } from "@reusedo/auth";
import { Avatar, AvatarFallback } from "@reusedo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useChatRealtime } from "../../hooks/useChatRealtime";
import { MessageBubble } from "./components/MessageBubble";
import { MessageComposer } from "./components/MessageComposer";

export const ConversationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook up realtime messages
  useChatRealtime({ conversationId: id, userId: user?.uid });

  const { data: conversation, isLoading: isLoadingConv } = useQuery({
    queryKey: ["chat", "conversation", id],
    queryFn: () => ChatService.getConversation(id as string),
    enabled: !!id && !!user,
  });

  const { data: messages = [], isLoading: isLoadingMsgs } = useQuery({
    queryKey: ["chat", "messages", id],
    queryFn: () => ChatService.getMessages(id as string, 100),
    enabled: !!id && !!user,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (messageId: string) => ChatService.markAsRead(id as string, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  // Auto-scroll to bottom and mark read
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      // Find last unread message from others
      const lastOtherMsg = [...messages].reverse().find((m) => m.sender_id !== user?.uid);
      if (lastOtherMsg && lastOtherMsg.status !== "read") {
        markReadMutation.mutate(lastOtherMsg.id);
      }
    }
  }, [messages, user?.uid, markReadMutation.mutate]);

  const handleSendMessage = async (content: string) => {
    if (!id || !user) return;

    // Optimistic update omitted for brevity, handled via Realtime broadcast slightly after
    await ChatService.sendMessage(id, {
      type: "text",
      content,
    });
  };

  const handleSendImage = async (file: File) => {
    if (!id || !user) return;
    await ChatService.uploadAttachment(id, file);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await ChatService.addReaction(messageId, emoji);
  };

  if (isLoadingConv || isLoadingMsgs) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading chat...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Temporary mapping
  const otherParticipant = (conversation as any)?.participants?.find(
    // biome-ignore lint/suspicious/noExplicitAny: Temporary mapping
    (p: any) => p.user_id !== user?.uid,
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card/50">
        <Avatar className="w-10 h-10">
          <AvatarFallback>
            {otherParticipant?.user_id?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">User {otherParticipant?.user_id?.substring(0, 4)}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            Context: {conversation.context_type}
          </p>
        </div>
      </div>

      {/* Context Banner */}
      <div className="bg-primary/5 border-b p-3 flex items-center gap-2 text-sm text-primary">
        <Info className="w-4 h-4" />
        <span>
          This conversation is related to a <strong>{conversation.context_type}</strong>. Safe
          exchanging!
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isCurrentUser={msg.sender_id === user?.uid}
            onAddReaction={(emoji) => handleReaction(msg.id, emoji)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer onSendMessage={handleSendMessage} onSendImage={handleSendImage} />
    </div>
  );
};
