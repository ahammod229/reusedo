import { useAuthStore } from "@/features/auth";
import { ChatService, UserService } from "@/services/api";
import { Avatar, AvatarFallback, Input } from "@/shared/components/ui";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRightLeft, Gift, Info, Package, Search } from "lucide-react";
import { Link, useParams } from "react-router";
import { useChatRealtime } from "../../hooks/useChatRealtime";

export const ConversationList = () => {
  const { id: activeId } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: UserService.getMyProfile,
    enabled: !!user,
  });

  // Realtime hook for updating conversation unread counts and sorting
  useChatRealtime({ userId: profile?.id });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => ChatService.getConversations(),
    enabled: !!profile?.id,
  });

  const getContextIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="w-3 h-3" />;
      case "exchange":
        return <ArrowRightLeft className="w-3 h-3" />;
      case "donation":
        return <Gift className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // biome-ignore lint/suspicious/noExplicitAny: Temporary mapping
  const getOtherParticipant = (participants: any[]) => {
    return participants.find((p) => p.user_id !== profile?.id);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">Loading conversations...</div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r bg-card/50">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-9 bg-background" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No conversations yet</div>
        ) : (
          // biome-ignore lint/suspicious/noExplicitAny: Temporary mapping
          conversations.map((conv: any) => {
            const other = getOtherParticipant(conv.participants);
            const isActive = conv.id === activeId;
            const lastMessage = conv.messages?.[0];
            // @ts-ignore - my_participant_state is dynamically added in repository
            const unreadCount = conv.my_participant_state?.unread_count || 0;

            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className={`flex items-start gap-3 p-4 border-b transition-colors hover:bg-accent/50 ${isActive ? "bg-accent" : ""}`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback>
                    {other?.user_id?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">User {other?.user_id?.substring(0, 4)}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {lastMessage
                        ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })
                        : "New"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <span className="bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                      {getContextIcon(conv.context_type)}
                      <span className="capitalize">{conv.context_type}</span>
                    </span>
                  </div>

                  <p
                    className={`text-sm truncate ${unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {lastMessage?.type === "image"
                      ? "🖼️ Image"
                      : lastMessage?.content || "Started a conversation"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
