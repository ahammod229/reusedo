import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@/shared/components/ui";
import {
  BadgeCheck,
  Bookmark,
  Check,
  Eye,
  Flag,
  Gift,
  HandHeart,
  MoreHorizontal,
  Settings2,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Photo } from "./Photo";
import { PostTags, ReportDialog, StatusRibbon, useShare } from "./PostBits";
import { useKm, useLang, useNum, useT } from "./i18n";
import { useMyUsername } from "./me";
import { useSaved } from "./saved";
import { type FeedPost, categoryOf } from "./types";

/** A post card. `flush` runs it edge to edge on phones (the main feed); otherwise it's always a rounded card. */
export function PostCard({ post, flush = false }: { post: FeedPost; flush?: boolean }) {
  const t = useT();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const bn = lang === "bn";
  const isSaved = useSaved((s) => s.ids.includes(post.id));
  const toggleSaved = useSaved((s) => s.toggle);
  const { share, copied } = useShare();
  const [reporting, setReporting] = useState(false);
  const cat = categoryOf(post.category);
  const isOffer = post.kind === "offer";
  const open = post.status === "available";
  const mine = post.author.username === useMyUsername();
  const dist = useKm()(post.distanceKm);
  const href = `/post/${post.id}`;

  const action =
    "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted active:bg-muted";

  return (
    <article
      className={cn(
        "overflow-hidden bg-card text-card-foreground",
        flush ? "sm:rounded-2xl sm:border sm:shadow-sm" : "rounded-2xl border shadow-sm",
        post.status === "given" && "opacity-80",
      )}
    >
      <header className="flex items-center gap-2.5 px-4 pb-2 pt-3">
        <Link
          to={`/users/${post.author.username}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
          aria-label={post.author.name}
        >
          {post.author.name.charAt(0)}
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/users/${post.author.username}`}
              className="truncate text-[15px] font-semibold hover:underline"
            >
              {post.author.name}
            </Link>
            {post.author.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t("verified")} />
            )}
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                isOffer ? "bg-offer-soft text-offer" : "bg-need-soft text-need",
              )}
            >
              {isOffer ? t("offer") : t("needBadge")}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {post.postedAt} · {post.area}
            {dist ? ` · ${dist}` : ""}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={bn ? "আরও" : "More"}
              className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link to={href}>
                <Eye className="mr-2 h-4 w-4" /> {bn ? "বিস্তারিত দেখুন" : "View details"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSaved(post.id)}>
              <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "fill-primary text-primary")} />
              {isSaved ? (bn ? "সেভ থেকে সরান" : "Unsave") : t("save")}
            </DropdownMenuItem>
            {!mine && (
              <DropdownMenuItem onClick={() => setReporting(true)} className="text-destructive">
                <Flag className="mr-2 h-4 w-4" /> {t("report")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-1.5 px-4 pb-3">
        <h3 className="text-[15px] font-semibold leading-snug">
          <Link to={href}>{post.title}</Link>
        </h3>
        {post.description && (
          <p className="line-clamp-3 text-[15px] leading-relaxed text-foreground/80">
            {post.description}
          </p>
        )}
        <PostTags post={post} compact />
      </div>

      <Link to={href} className="relative block">
        <Photo
          post={post}
          // A real photo gets the full width; without one, a short emoji band is enough.
          className={post.images.length ? "aspect-[4/3] max-h-[28rem]" : "h-28"}
          emojiSize="text-5xl"
        />
        <StatusRibbon status={post.status} />
      </Link>

      <div className="flex items-center justify-between gap-2 px-4 py-2 text-[13px] text-muted-foreground">
        <span className="truncate">
          {cat.emoji} {bn ? cat.bn : cat.en} · {t("free")}
        </span>
        {post.requests > 0 && (
          <span className="shrink-0">
            {num(post.requests)}{" "}
            {bn
              ? isOffer
                ? "জন চেয়েছেন"
                : "জন সাহায্য করতে চান"
              : isOffer
                ? "requested"
                : "offered help"}
          </span>
        )}
      </div>

      <div className="mx-4 flex items-center gap-1 border-t py-1">
        {mine ? (
          <Link to="/my-posts" className={action}>
            <Settings2 className="h-[18px] w-[18px]" />
            {bn ? "ম্যানেজ" : "Manage"}
          </Link>
        ) : open ? (
          <Link
            to={`${href}?request=1`}
            className={cn(
              action,
              "flex-[1.4] whitespace-nowrap",
              isOffer ? "text-offer" : "text-need",
            )}
          >
            {isOffer ? (
              <Gift className="h-[18px] w-[18px]" />
            ) : (
              <HandHeart className="h-[18px] w-[18px]" />
            )}
            {isOffer ? t("request") : t("iHaveThis")}
          </Link>
        ) : (
          <Link to={href} className={action}>
            <Eye className="h-[18px] w-[18px]" />
            {bn ? "বিস্তারিত" : "Details"}
          </Link>
        )}
        <button
          type="button"
          className={cn(action, isSaved && "text-primary")}
          aria-pressed={isSaved}
          onClick={() => toggleSaved(post.id)}
        >
          <Bookmark className={cn("h-[18px] w-[18px]", isSaved && "fill-current")} />
          {isSaved ? (bn ? "সেভ হয়েছে" : "Saved") : t("save")}
        </button>
        <button type="button" className={action} onClick={() => share(post.title, href)}>
          {copied ? (
            <Check className="h-[18px] w-[18px] text-success" />
          ) : (
            <Share2 className="h-[18px] w-[18px]" />
          )}
          {copied ? (bn ? "কপি হয়েছে" : "Copied") : t("share")}
        </button>
      </div>
      <ReportDialog post={post} open={reporting} onOpenChange={setReporting} />
    </article>
  );
}
