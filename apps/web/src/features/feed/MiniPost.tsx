import { cn } from "@/shared/components/ui";
import { Link } from "react-router";
import { Photo } from "./Photo";
import { PostTags } from "./PostBits";
import { useKm } from "./i18n";
import type { FeedPost } from "./types";

/** Compact tile for horizontal rails (Home "for you"). */
export function MiniPost({ post, className }: { post: FeedPost; className?: string }) {
  const km = useKm()(post.distanceKm);
  return (
    <Link
      to={`/post/${post.id}`}
      className={cn(
        "group flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Photo post={post} className="h-28" emojiSize="text-5xl" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">
          {post.title}
        </p>
        <PostTags post={post} compact />
        <p className="mt-auto text-xs text-muted-foreground">
          {post.area}
          {km && ` · ${km}`}
        </p>
      </div>
    </Link>
  );
}
