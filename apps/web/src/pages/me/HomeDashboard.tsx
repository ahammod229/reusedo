import { QueryState } from "@/features/data/QueryState";
import { matchesFilters } from "@/features/data/filtering";
import { useDashboard, useFeed, useUser } from "@/features/data/hooks";
import { MiniPost } from "@/features/feed/MiniPost";
import { PostTags } from "@/features/feed/PostBits";
import { useAlerts } from "@/features/feed/alerts";
import { toParams } from "@/features/feed/feedParams";
import { levelOf } from "@/features/feed/gamify";
import { makeImpactCard, shareOrSaveImage } from "@/features/feed/impactCard";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { useMe } from "@/features/feed/me";
import { categoryOf, eduOf } from "@/features/feed/types";
import { Button, cn } from "@/shared/components/ui";
import {
  ArrowRight,
  Bell,
  Camera,
  ChevronRight,
  Gift,
  HandHeart,
  Heart,
  Leaf,
  MessageCircle,
  Repeat,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { type ReactNode, Suspense, lazy, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

// Leaflet is ~40 KB; load it only when Home renders.
const DonationMap = lazy(() => import("@/features/map/DonationMap"));

function greeting(tr: (bn: string, en: string) => string) {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return tr("শুভ সকাল", "Good morning");
  if (h >= 12 && h < 16) return tr("শুভ দুপুর", "Good afternoon");
  if (h >= 16 && h < 18) return tr("শুভ বিকেল", "Good afternoon");
  if (h >= 18 && h < 20) return tr("শুভ সন্ধ্যা", "Good evening");
  return tr("শুভ রাত্রি", "Good evening");
}

export function HomeDashboard() {
  const tr = useTr();
  const { data: d, isLoading, error, refetch } = useDashboard();
  const { data: me } = useUser("rakib");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5">
      <Helmet>
        <title>ReuseDo — {tr("হোম", "Home")}</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={3}>
        {d && me && (
          <>
            <Hero name={me.name.split(" ")[0]} given={me.stats.given} />
            <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-muted" />}>
              <DonationMap />
            </Suspense>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="min-w-0 space-y-5">
                <Todo todo={d.todo} />
                <ForYou posts={d.forYou} />
                <NeedsNearby posts={d.needsNearby} />
              </div>
              <div className="space-y-5">
                <Impact stats={me.stats} />
                <Alerts />
                {d.community && <Community c={d.community} activeNearby={d.activeNearby} />}
                <Thanks notes={d.recentThanks} />
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}

function Hero({ name, given }: { name: string; given: number }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const lv = levelOf(given);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.42_0.1_170)] p-5 text-primary-foreground sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-white/5" />
      <p className="text-sm font-medium opacity-90">
        {greeting(tr)}, {name} 👋
      </p>
      <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
        {tr("আজ কারও দিন একটু সহজ করবেন?", "Make someone's day a little easier?")}
      </h1>

      <div
        className="mt-4 max-w-md rounded-2xl p-3"
        style={{ background: "rgb(255 255 255 / 0.14)" }}
      >
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-bold">
            {lv.emoji} {lang === "bn" ? lv.bn : lv.en}
          </span>
          {lv.next ? (
            <span className="text-xs opacity-90">
              {tr(
                `আর ${num(lv.toNext)}টি দিলেই ${lv.next.emoji} ${lv.next.bn}`,
                `${lv.toNext} more to ${lv.next.emoji} ${lv.next.en}`,
              )}
            </span>
          ) : (
            <span className="text-xs opacity-90">{tr("সর্বোচ্চ লেভেল!", "Top level!")}</span>
          )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25" aria-hidden>
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${Math.max(6, lv.progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
          <Link to="/post/new">
            <Camera className="mr-2 h-5 w-5" /> {tr("কিছু দিন", "Give something")}
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-white/50 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
        >
          <Link to="/post/new?kind=need">
            <HandHeart className="mr-2 h-5 w-5" /> {tr("কিছু চান", "Ask for something")}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Card({
  title,
  action,
  children,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ to }: { to: string }) {
  const tr = useTr();
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
    >
      {tr("সব দেখুন", "See all")} <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function Todo({ todo }: { todo: import("@/features/data/types").Dashboard["todo"] }) {
  const tr = useTr();
  const num = useNum();
  const items = [
    {
      n: todo.requestsToAnswer,
      icon: Gift,
      label: tr("টি রিকোয়েস্টের উত্তর দিন", " requests waiting for your answer"),
      to: "/exchanges",
      tone: "bg-offer-soft text-offer",
    },
    {
      n: todo.unreadMessages,
      icon: MessageCircle,
      label: tr("টি না-পড়া মেসেজ", " unread messages"),
      to: "/messages",
      tone: "bg-primary/10 text-primary",
    },
    {
      n: todo.activeExchanges,
      icon: Repeat,
      label: tr("টি লেনদেন চলছে", " exchanges in progress"),
      to: "/exchanges",
      tone: "bg-muted text-foreground",
    },
    {
      n: todo.thanksToWrite.length,
      icon: Heart,
      label: tr("জনকে ধন্যবাদ জানানো বাকি", " people to thank"),
      to: "/exchanges",
      tone: "bg-need-soft text-need",
    },
  ].filter((i) => i.n > 0);

  return (
    <Card title={tr("আপনার জন্য অপেক্ষা করছে", "Waiting for you")}>
      {items.length === 0 ? (
        <p className="rounded-xl bg-muted/60 py-6 text-center text-sm text-muted-foreground">
          ✨ {tr("সব কাজ শেষ — দারুণ!", "All caught up — nice!")}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i.label}>
              <Link
                to={i.to}
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/60"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    i.tone,
                  )}
                >
                  <i.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <b className="text-base">{num(i.n)}</b>
                  {i.label}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ForYou({ posts }: { posts: import("@/features/feed/types").FeedPost[] }) {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const level = useMe((s) => s.level);
  const edu = eduOf(level);
  const to = `/feed?${toParams({ kind: "offer", category: "all", scope: "country", level: level ?? "all" })}`;
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" /> {tr("আপনার জন্য", "For you")}
          {edu && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {lang === "bn" ? edu.bn : edu.en}
            </span>
          )}
        </span>
      }
      action={<SeeAll to={to} />}
    >
      {!level && (
        <Link
          to="/profile/edit"
          className="mb-3 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-sm font-medium text-primary"
        >
          🎓{" "}
          {tr(
            "আপনি কোন ক্লাসে পড়েন জানালে মানানসই জিনিস আগে দেখাব →",
            "Tell us your class to see the best matches first →",
          )}
        </Link>
      )}
      {posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {tr(
            "এখন মানানসই কিছু নেই — খোঁজ সেভ করে রাখুন, এলেই জানাব।",
            "Nothing matching right now — save a search and we'll tell you.",
          )}
        </p>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
          {posts.map((p) => (
            <MiniPost key={p.id} post={p} />
          ))}
        </div>
      )}
    </Card>
  );
}

function NeedsNearby({ posts }: { posts: import("@/features/feed/types").FeedPost[] }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-1.5">
          <HandHeart className="h-4 w-4 text-need" /> {tr("কাছেই যাদের দরকার", "Needed near you")}
        </span>
      }
      action={<SeeAll to="/feed?kind=need&scope=area&sort=urgent" />}
    >
      {posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {tr("আশেপাশে এখন কোনো চাওয়া নেই", "No requests nearby right now")}
        </p>
      ) : (
        <ul className="divide-y">
          {posts.map((p) => {
            const cat = categoryOf(p.category);
            return (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-need-soft text-2xl">
                  {cat.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/post/${p.id}`}
                    className="line-clamp-1 text-sm font-semibold hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.author.name} · {p.area} · {num(p.distanceKm.toFixed(1))}{" "}
                    {lang === "bn" ? "কিমি" : "km"}
                  </p>
                  <div className="mt-1">
                    <PostTags post={p} compact />
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0 bg-need text-white hover:bg-need/90">
                  <Link to={`/post/${p.id}?request=1`}>{tr("আমার আছে", "I have it")}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Impact({ stats }: { stats: import("@/features/feed/gamify").ImpactStats }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const [busy, setBusy] = useState(false);
  const lv = levelOf(stats.given);

  const shareCard = async () => {
    setBusy(true);
    try {
      const blob = await makeImpactCard({
        title: tr("আমার ReuseDo অবদান", "My ReuseDo impact"),
        level: lang === "bn" ? lv.bn : lv.en,
        emoji: lv.emoji,
        lines: [
          { value: num(stats.given), label: tr("জিনিস দিয়েছি", "items given") },
          { value: `≈${num(Math.round(stats.kgSaved))}`, label: tr("কেজি বাঁচিয়েছি", "kg saved") },
        ],
        footer: tr(
          "যা দরকার নেই, কারও জন্য আশীর্বাদ — reusedo",
          "What you don't need blesses someone — reusedo",
        ),
      });
      await shareOrSaveImage(
        blob,
        "reusedo-impact.png",
        tr("আমি ReuseDo-তে দান করছি। আপনিও পারেন!", "I give on ReuseDo. You can too!"),
      );
    } finally {
      setBusy(false);
    }
  };

  const tiles = [
    { icon: Gift, v: num(stats.given), l: tr("দিয়েছেন", "Given"), tone: "text-offer" },
    { icon: HandHeart, v: num(stats.received), l: tr("পেয়েছেন", "Received"), tone: "text-need" },
    {
      icon: Heart,
      v: num(stats.thanksReceived),
      l: tr("ধন্যবাদ পেয়েছেন", "Thank-yous"),
      tone: "text-destructive",
    },
    {
      icon: Leaf,
      v: `≈${num(Math.round(stats.kgSaved))}`,
      l: tr("কেজি বাঁচিয়েছেন", "kg saved"),
      tone: "text-success",
    },
  ];
  return (
    <Card title={tr("আপনার অবদান", "Your impact")} action={<SeeAll to="/profile" />}>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-xl bg-muted/60 p-3">
            <t.icon className={cn("h-4 w-4", t.tone)} />
            <p className="mt-1 text-2xl font-extrabold leading-none">{t.v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {tr("কেজির হিসাব আনুমানিক — জিনিসের ধরন দেখে।", "The kg figure is an estimate by item type.")}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={busy || stats.given === 0}
        onClick={shareCard}
      >
        <Share2 className="mr-1.5 h-4 w-4" />
        {tr("অবদানের ছবি শেয়ার করুন", "Share my impact picture")}
      </Button>
    </Card>
  );
}

function Alerts() {
  const tr = useTr();
  const num = useNum();
  const alerts = useAlerts((s) => s.list);
  const { data: all = [] } = useFeed({ kind: "all", category: "all", scope: "country" });
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-primary" /> {tr("সেভ করা খোঁজ", "Saved searches")}
        </span>
      }
      action={<SeeAll to="/saved?tab=searches" />}
    >
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tr(
            "ফিডে ফিল্টার দিয়ে “এই খোঁজ সেভ করুন” চাপুন — নতুন কিছু এলেই জানাব।",
            "Filter the feed and tap “Save this search” — we'll tell you when something new arrives.",
          )}
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 3).map((a) => {
            const n = all.filter((p) => matchesFilters(p, a.filters) && p.hoursAgo <= 72).length;
            return (
              <li key={a.id}>
                <Link
                  to={`/feed?${toParams(a.filters)}`}
                  className="flex items-center justify-between gap-2 rounded-xl border p-3 text-sm hover:bg-accent/60"
                >
                  <span className="truncate font-medium">{a.label}</span>
                  {n > 0 ? (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      {tr(`${num(n)} নতুন`, `${n} new`)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {tr("নতুন নেই", "none new")}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Community({
  c,
  activeNearby,
}: {
  c: NonNullable<import("@/features/data/types").Dashboard["community"]>;
  activeNearby: number;
}) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const pct = Math.min(100, Math.round((c.current / c.target) * 100));
  return (
    <Card title={`📚 ${tr("সবাই মিলে", "Together")}`}>
      <p className="font-semibold leading-snug">{lang === "bn" ? c.bn : c.en}</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-offer"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>
          <b className="text-foreground">{num(c.current)}</b> / {num(c.target)} {tr("বই", "books")}
        </span>
        <span>{lang === "bn" ? c.endsBn : c.endsEn}</span>
      </p>
      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
        <Link to="/post/new">{tr("আমিও বই দেব", "I'll give books too")}</Link>
      </Button>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {tr(
          `এই সপ্তাহে আপনার জেলায় ${num(activeNearby)} জন সক্রিয়`,
          `${activeNearby} people active in your district this week`,
        )}
      </p>
    </Card>
  );
}

function Thanks({ notes }: { notes: import("@/features/data/types").ThanksNote[] }) {
  const tr = useTr();
  if (!notes.length) return null;
  return (
    <Card
      title={`💌 ${tr("আপনি ধন্যবাদ পেয়েছেন", "Thank-yous for you")}`}
      action={<SeeAll to="/profile?tab=thanks" />}
    >
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.by + n.when} className="rounded-xl bg-need-soft/60 p-3">
            <p className="text-sm leading-relaxed">“{n.text}”</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              — {n.by} · {n.item}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
