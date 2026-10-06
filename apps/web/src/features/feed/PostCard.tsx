import { Badge, Button, Card, cn } from "@/shared/components/ui";
import { Bookmark, BadgeCheck, MapPin, MessageCircle, Share2, Flag } from "lucide-react";
import { Link } from "react-router";
import { useLang, useNum, useT } from "./i18n";
import { type FeedPost, categoryOf } from "./types";

export function PostCard({ post }: { post: FeedPost }) {
  const t = useT();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const cat = categoryOf(post.category);
  const isOffer = post.kind === "offer";
  const km = post.distanceKm < 10 ? post.distanceKm.toFixed(1) : Math.round(post.distanceKm);
  const dist = `${num(km)} ${lang === "bn" ? "কিমি" : "km"}`;

  return (
    <Card className="overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {post.author.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <span className="truncate">{post.author.name}</span>
            {post.author.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t("verified")} />
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {post.area}, {post.district} · {dist} · {post.postedAt}
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

      <div className="px-4">
        <h3 className="text-base font-semibold leading-snug">
          <Link to={`/post/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{post.description}</p>
      </div>

      <div
        className={cn(
          "mx-4 mt-3 flex h-48 items-center justify-center rounded-lg bg-gradient-to-br text-6xl",
          cat.tone,
        )}
        role="img"
        aria-label={lang === "bn" ? cat.bn : cat.en}
      >
        {cat.emoji}
      </div>

      <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted-foreground">
        <Badge variant="outline">{lang === "bn" ? cat.bn : cat.en}</Badge>
        <Badge variant="outline">{t("free")}</Badge>
        {post.requests > 0 && (
          <span>
            {num(post.requests)} {lang === "bn" ? "জন চেয়েছেন" : "requested"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 p-4">
        <Button
          className={cn("flex-1", !isOffer && "bg-need text-white hover:bg-need/90")}
          size="sm"
        >
          {isOffer ? t("request") : t("iHaveThis")}
        </Button>
        <Button variant="outline" size="sm" className="w-10 px-0" aria-label={t("chat")}>
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="w-10 px-0" aria-label={t("save")}>
          <Bookmark className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="w-10 px-0" aria-label={t("share")}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="w-10 px-0" aria-label={t("report")}>
          <Flag className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
