import { cn } from "@/shared/components/ui";
import { useState } from "react";
import { useLang } from "./i18n";
import { type FeedPost, categoryOf } from "./types";

/**
 * Real photo when the post has one (lazy-loaded, fixed box so the feed never jumps);
 * category emoji on a soft gradient otherwise or if the image fails to load.
 */
export function Photo({
  post,
  index = 0,
  className,
  emojiSize = "text-6xl",
  priority = false,
}: {
  post: Pick<FeedPost, "images" | "category" | "title">;
  index?: number;
  className?: string;
  emojiSize?: string;
  priority?: boolean;
}) {
  const lang = useLang((s) => s.lang);
  const [failed, setFailed] = useState(false);
  const cat = categoryOf(post.category);
  const src = post.images[index];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={post.title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("w-full bg-muted object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br",
        cat.tone,
        emojiSize,
        className,
      )}
      role="img"
      aria-label={lang === "bn" ? cat.bn : cat.en}
    >
      {cat.emoji}
    </div>
  );
}
