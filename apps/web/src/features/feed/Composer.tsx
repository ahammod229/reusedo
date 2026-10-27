import { useAuthStore, useProfile } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui";
import { Camera, HandHeart, ImagePlus } from "lucide-react";
import { Link } from "react-router";
import { useTr } from "./i18n";

/** "What do you want to give?" box at the top of the feed: one tap to start a post. */
export function Composer() {
  const tr = useTr();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const name = profile?.name || user?.displayName || "";
  const avatar = profile?.avatarUrl ?? user?.photoURL ?? undefined;

  return (
    <section className="bg-card sm:rounded-2xl sm:border sm:shadow-sm">
      <div className="flex items-center gap-2.5 px-4 pb-2.5 pt-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={avatar} alt="" />
          <AvatarFallback className="bg-primary/15 font-semibold text-primary">
            {name ? name.charAt(0).toUpperCase() : "🙂"}
          </AvatarFallback>
        </Avatar>
        <Link
          to="/post/new"
          className="flex h-10 min-w-0 flex-1 items-center rounded-full border bg-muted/50 px-4 text-[15px] text-muted-foreground transition-colors active:bg-muted"
        >
          <span className="truncate">
            {tr("আজ কী দিয়ে দিতে চান?", "What would you like to give?")}
          </span>
        </Link>
        <Link
          to="/post/new"
          aria-label={tr("ছবি দিয়ে পোস্ট", "Post with a photo")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-offer transition-colors active:bg-muted"
        >
          <ImagePlus className="h-6 w-6" />
        </Link>
      </div>
      <div className="grid grid-cols-2 border-t text-sm font-semibold text-muted-foreground">
        <Link
          to="/post/new"
          className="flex items-center justify-center gap-2 py-2.5 transition-colors active:bg-muted"
        >
          <Camera className="h-5 w-5 text-offer" />
          {tr("কিছু দিন", "Give")}
        </Link>
        <Link
          to="/post/new?kind=need"
          className="flex items-center justify-center gap-2 border-l py-2.5 transition-colors active:bg-muted"
        >
          <HandHeart className="h-5 w-5 text-need" />
          {tr("কিছু চাই", "Ask")}
        </Link>
      </div>
    </section>
  );
}
