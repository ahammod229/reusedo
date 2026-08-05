import { Button } from "@reusedo/ui";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Image as ImageIcon, Send, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessageComposerProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendImage: (file: File) => Promise<void>;
  onTypingStart?: () => void;
  disabled?: boolean;
}

export const MessageComposer = ({
  onSendMessage,
  onSendImage,
  onTypingStart,
  disabled = false,
}: MessageComposerProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustTextareaHeight();

    // Fire typing indicator event (debounced in the parent or hook)
    if (onTypingStart && e.target.value.length === 1) {
      onTypingStart();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const textContent = content.trim();
    if ((!textContent && !selectedImage) || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (selectedImage) {
        await onSendImage(selectedImage);
        clearImage();
      } else if (textContent) {
        await onSendMessage(textContent);
      }
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-background border-t">
      {/* Image Preview Area */}
      {imagePreview && (
        <div className="relative inline-block w-fit">
          <img
            loading="lazy"
            src={imagePreview}
            alt="Preview"
            className="h-24 w-auto rounded-md object-cover border"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 relative">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSubmitting || !!selectedImage}
          className="flex-shrink-0 mb-0.5"
          title="Attach Image"
        >
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
        </Button>

        <div className="relative flex-1 flex items-end bg-muted rounded-2xl border focus-within:ring-1 focus-within:ring-primary/50 overflow-visible">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || isSubmitting || !!selectedImage}
            className="flex-1 max-h-[120px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-sm"
            rows={1}
          />

          <div ref={emojiRef} className="pb-2 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => setShowEmoji(!showEmoji)}
              disabled={disabled || isSubmitting || !!selectedImage}
            >
              <Smile className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>

            {showEmoji && (
              <div className="absolute bottom-12 right-0 z-50 shadow-xl rounded-lg">
                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || isSubmitting || (!content.trim() && !selectedImage)}
          size="icon"
          className="flex-shrink-0 rounded-full h-10 w-10 mb-0.5"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground text-center">
        Press Shift + Enter for new line.
      </div>
    </div>
  );
};
