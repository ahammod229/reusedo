import { Button, Card, cn } from "@/shared/components/ui";
import { BadgeCheck, Bookmark, Check, Flag, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Photo } from "./Photo";
import { PostTags, ReportDialog, StatusRibbon, useShare } from "./PostBits";
import { useLang, useNum, useT } from "./i18n";
import { useMyUsername } from "./me";
import { useSaved } from "./saved";
import { type FeedPost, categoryOf } from "./types";

export function PostCard({ post }: { post: FeedPost }) {
  const t = useT();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const isSaved = useSaved((s) => s.ids.includes(post.id));
  const toggleSaved = useSaved((s) => s.toggle);
  const { share, copied } = useShare();
  const [reporting, setReporting] = useState(false);
  const cat = categoryOf(post.category);
  const isOffer = post.kind === "offer";
  const open = post.status === "available";
  const mine = post.author.username === useMyUsername();
  const km = post.distanceKm < 10 ? post.distanceKm.toFixed(1) : Math.round(post.distanceKm);
  const dist = `${num(km)} ${lang === "bn" ? "কিমি" : "km"}`;
  const href = `/post/${post.id}`;

  return (
    <Card className={cn("overflow-hidden rounded-2xl", post.status === "given" && "opacity-80")}>
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link
          to={`/users/${post.author.username}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
          aria-label={post.author.name}
        >
          {post.author.name.charAt(0)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/users/${post.author.username}`}
            className="flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            <span className="truncate">{post.author.name}</span>
            {post.author.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t("verified")} />
            )}
          </Link>
          <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {post.area}, {post.district} · {dist} · {post.postedAt}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
            isOffer ? "bg-offer-soft text-offer" : "bg-need-soft text-need",
          )}
        >
          {isOffer ? `🎁 ${t("offer")}` : `🙏 ${t("needBadge")}`}
        </span>
      </div>

      <div className="space-y-2 px-4">
        <h3 className="text-base font-semibold leading-snug">
          <Link to={href} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
        <PostTags post={post} compact />
      </div>

      <Link to={href} className="relative mx-4 mt-3 block overflow-hidden rounded-xl">
        <Photo post={post} className="h-48" />
        <StatusRibbon status={post.status} />
      </Link>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pt-3 text-xs text-muted-foreground">
        <span className="rounded-full border px-2 py-0.5 font-medium">
          {cat.emoji} {lang === "bn" ? cat.bn : cat.en}
        </span>
        <span className="rounded-full border px-2 py-0.5 font-medium">{t("free")}</span>
        {post.requests > 0 && (
          <span>
            {num(post.requests)}{" "}
            {lang === "bn"
              ? isOffer
                ? "জন চেয়েছেন"
                : "জন সাহায্য করতে চান"
              : isOffer
                ? "requested"
                : "offered help"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 p-4">
        {mine ? (
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to="/my-posts">{lang === "bn" ? "আপনার পোস্ট · ম্যানেজ" : "Your post · manage"}</Link>
          </Button>
        ) : open ? (
          <Button
            asChild
            size="sm"
            className={cn("flex-1", !isOffer && "bg-need text-white hover:bg-need/90")}
          >
            <Link to={`${href}?request=1`}>{isOffer ? t("request") : t("iHaveThis")}</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={href}>{lang === "bn" ? "বিস্তারিত" : "Details"}</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="w-10 px-0">
          <Link to="/messages" aria-label={t("chat")}>
            <MessageCircle className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 px-0"
          aria-label={t("save")}
          aria-pressed={isSaved}
          onClick={() => toggleSaved(post.id)}
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 px-0"
          aria-label={copied ? (lang === "bn" ? "লিংক কপি হয়েছে" : "Link copied") : t("share")}
          onClick={() => share(post.title, href)}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 px-0"
          aria-label={t("report")}
          onClick={() => setReporting(true)}
        >
          <Flag className="h-4 w-4" />
        </Button>
      </div>
      <ReportDialog post={post} open={reporting} onOpenChange={setReporting} />
    </Card>
  );
}
