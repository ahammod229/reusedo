import { QueryState } from "@/features/data/QueryState";
import { useFeed, usePost } from "@/features/data/hooks";
import { AdCard } from "@/features/feed/AdCard";
import { Photo } from "@/features/feed/Photo";
import { PostCard } from "@/features/feed/PostCard";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { Initial, Pill, TrustRing } from "@/features/feed/parts";
import { useSaved } from "@/features/feed/saved";
import type { FeedPost } from "@/features/feed/types";
import { categoryOf } from "@/features/feed/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
  cn,
} from "@/shared/components/ui";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Flag,
  MapPin,
  MessageCircle,
  PackageCheck,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router";

export function PostDetail() {
  const { id } = useParams();
  const tr = useTr();
  const { data: post, isLoading, error, refetch } = usePost(id ?? "");
  const { data: all = [] } = useFeed({ kind: "all", category: "all", scope: "country" });

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
      {post ? (
        <PostDetailView post={post} all={all} />
      ) : (
        <p className="py-24 text-center text-muted-foreground">
          {tr("পোস্টটি পাওয়া যায়নি", "Post not found")}
        </p>
      )}
    </QueryState>
  );
}

function PostDetailView({ post, all }: { post: FeedPost; all: FeedPost[] }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const navigate = useNavigate();
  const cat = categoryOf(post.category);
  const isOffer = post.kind === "offer";
  const [active, setActive] = useState(0);

  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [via, setVia] = useState<"pickup" | "courier">("pickup");
  const [msg, setMsg] = useState("");
  const saved = useSaved((s) => s.ids.includes(post.id));
  const toggleSaved = useSaved((s) => s.toggle);
  const similar = all.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 2);
  const condition = {
    new: tr("নতুন", "New"),
    good: tr("ভালো অবস্থায়", "Good"),
    used: tr("ব্যবহৃত", "Used"),
  }[post.condition];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-28 sm:pb-8">
      <Helmet>
        <title>{post.title} — ReuseDo</title>
      </Helmet>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tr("ফিরে যান", "Back")}
      </button>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-20">
          <Photo
            post={post}
            index={active}
            priority
            className="h-64 rounded-3xl sm:h-80 lg:h-[26rem]"
            emojiSize="text-8xl"
          />
          {post.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none">
              {post.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${i + 1}/${post.images.length}`}
                  aria-current={i === active}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl",
                    i === active && "ring-2 ring-primary",
                  )}
                >
                  <Photo post={post} index={i} className="h-16 w-16" emojiSize="text-2xl" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mt-5 space-y-3 lg:mt-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={isOffer ? "offer" : "need"}>
                {isOffer
                  ? `🎁 ${tr("আমার কাছে আছে", "I have this")}`
                  : `🙏 ${tr("আমার দরকার", "I need this")}`}
              </Pill>
              <Pill>{lang === "bn" ? cat.bn : cat.en}</Pill>
              <Pill tone="success">{tr("বিনামূল্যে", "Free")}</Pill>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{post.title}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {post.area}, {post.district}
              </span>
              <span>{post.postedAt}</span>
              <span>
                {num(
                  post.distanceKm < 10 ? post.distanceKm.toFixed(1) : Math.round(post.distanceKm),
                )}{" "}
                {tr("কিমি দূরে", "km away")}
              </span>
            </p>
            <p className="whitespace-pre-line text-base leading-relaxed">{post.description}</p>

            <dl className="grid grid-cols-2 gap-3 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{tr("অবস্থা", "Condition")}</dt>
                <dd className="font-semibold">{condition}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tr("রিকোয়েস্ট", "Requests")}</dt>
                <dd className="font-semibold">{num(post.requests)}</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-muted-foreground">{tr("হস্তান্তর", "Handover")}</dt>
                <dd className="font-semibold">{tr("সরাসরি / কুরিয়ার", "In person / courier")}</dd>
              </div>
            </dl>

            <div className="flex gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSaved(post.id)}
                aria-pressed={saved}
              >
                <Bookmark className={cn("mr-1.5 h-4 w-4", saved && "fill-primary text-primary")} />
                {saved ? tr("সেভ করা হয়েছে", "Saved") : tr("সেভ", "Save")}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-1.5 h-4 w-4" /> {tr("শেয়ার", "Share")}
              </Button>
              <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground">
                <Flag className="mr-1.5 h-4 w-4" /> {tr("রিপোর্ট", "Report")}
              </Button>
            </div>
          </div>

          <section
            className="mt-6 rounded-2xl border bg-card p-4"
            aria-label={tr("দাতার তথ্য", "Poster")}
          >
            <div className="flex items-center gap-3">
              <Initial name={post.author.name} className="h-12 w-12 text-lg" />
              <div className="min-w-0 flex-1">
                <Link
                  to="/users/rakib"
                  className="flex items-center gap-1 font-bold hover:underline"
                >
                  <span className="truncate">{post.author.name}</span>
                  {post.author.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {post.author.verified
                    ? tr("যাচাই করা সদস্য", "Verified member")
                    : tr("যাচাই বাকি", "Not verified yet")}
                </p>
              </div>
              <TrustRing value={post.author.trust} size={56} />
            </div>
            <p className="mt-3 flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {tr(
                "সঠিক ঠিকানা এখন দেখানো হচ্ছে না। রিকোয়েস্ট গ্রহণ হলে শুধু আপনারা দুজন দেখতে পাবেন।",
                "The exact address is hidden. Only the two of you see it once the request is accepted.",
              )}
            </p>
          </section>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-bold">{tr("আরও একই ধরনের", "More like this")}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {similar.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 max-w-2xl">
        <AdCard
          placement="post_detail"
          slot={0}
          ctx={{ district: post.district, category: post.category }}
        />
      </div>

      {/* Sticky action bar (above the mobile tab bar) */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-background/95 p-3 backdrop-blur sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <div className="mx-auto flex max-w-5xl gap-2">
          <Button asChild variant="outline" size="lg" className="px-4">
            <Link to="/messages/c1" aria-label={tr("চ্যাট", "Chat")}>
              <MessageCircle className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            className={cn("flex-1", !isOffer && "bg-need text-white hover:bg-need/90")}
            onClick={() => setOpen(true)}
            disabled={sent}
          >
            {sent
              ? tr("রিকোয়েস্ট পাঠানো হয়েছে ✓", "Request sent ✓")
              : isOffer
                ? tr("আমার চাই", "I want this")
                : tr("আমার কাছে আছে", "I have this")}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr("রিকোয়েস্ট পাঠান", "Send request")}</DialogTitle>
            <DialogDescription>{post.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="req-msg" className="mb-1.5 block text-sm font-semibold">
                {tr("দাতাকে কিছু বলুন", "Message to the giver")}
              </label>
              <Textarea
                id="req-msg"
                rows={3}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder={tr("কেন দরকার, কীভাবে কাজে লাগবে…", "Why you need it, how it will help…")}
              />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold">
                {tr("কীভাবে নেবেন?", "How will you receive it?")}
              </legend>
              <div className="grid gap-2">
                {(
                  [
                    [
                      "pickup",
                      PackageCheck,
                      tr("নিজে গিয়ে নেব", "I'll pick it up"),
                      tr("দাতার সাথে সময় ঠিক করে", "Agree a time with the giver"),
                    ],
                    [
                      "courier",
                      Truck,
                      tr("কুরিয়ারে চাই", "Send by courier"),
                      tr("চার্জ আপনি দেবেন (ডেলিভারিতে)", "You pay the fee on delivery"),
                    ],
                  ] as const
                ).map(([v, Icon, label, hint]) => (
                  <label
                    key={v}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                    )}
                  >
                    <input
                      type="radio"
                      name="via"
                      value={v}
                      checked={via === v}
                      onChange={() => setVia(v)}
                      className="sr-only"
                    />
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-muted-foreground">{hint}</span>
                    </span>
                    {via === v && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setSent(true);
                setOpen(false);
              }}
            >
              {tr("রিকোয়েস্ট পাঠান", "Send request")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
