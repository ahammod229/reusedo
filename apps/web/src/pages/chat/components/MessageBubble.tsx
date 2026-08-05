import { Avatar, AvatarFallback, AvatarImage } from "@reusedo/ui";
import type { Message, Reaction } from "@reusedo/validation";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  senderName?: string;
  senderAvatar?: string;
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
}

export const MessageBubble = ({
  message,
  isCurrentUser,
  senderName,
  senderAvatar,
  onRemoveReaction,
}: MessageBubbleProps) => {
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Helper to render reactions
  // @ts-ignore - reactions are joined in our query but might not be explicitly typed on Message yet
  const reactions: Reaction[] = message.reactions || [];
  const reactionCounts = reactions.reduce(
    (acc, curr) => {
      acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className={`flex w-full mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end gap-2`}
      >
        {!isCurrentUser && (
          <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
            <AvatarImage src={senderAvatar} alt={senderName || "User"} />
            <AvatarFallback>{senderName?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
          <div
            className={`
            relative px-4 py-2 rounded-2xl text-sm break-words
            ${
              isCurrentUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }
          `}
          >
            {message.type === "text" && <p className="whitespace-pre-wrap">{message.content}</p>}

            {message.type === "image" && message.metadata?.url && (
              <div className="mt-1 mb-1">
                <img
                  loading="lazy"
                  src={message.metadata.url}
                  alt="Attachment"
                  className="rounded-md max-w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
            )}

            {/* Future support for cards like product_card, exchange_card could go here */}

            <div
              className={`flex items-center gap-1 mt-1 text-[10px] ${isCurrentUser ? "text-primary-foreground/70 justify-end" : "text-muted-foreground justify-start"}`}
            >
              <span>{format(new Date(message.created_at), "h:mm a")}</span>

              {isCurrentUser && (
                <span className="ml-1">
                  {message.status === "sent" && <Check className="w-3 h-3" />}
                  {message.status === "delivered" && <CheckCheck className="w-3 h-3" />}
                  {message.status === "read" && <CheckCheck className="w-3 h-3 text-blue-300" />}
                </span>
              )}
            </div>
          </div>

          {Object.keys(reactionCounts).length > 0 && (
            <div className={`flex gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => onRemoveReaction?.(emoji)}
                  className="bg-background border shadow-sm rounded-full px-2 py-0.5 text-xs flex items-center gap-1 hover:bg-muted"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-muted-foreground">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
