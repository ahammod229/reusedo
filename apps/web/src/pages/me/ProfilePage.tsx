import { QueryState } from "@/features/data/QueryState";
import { useFeed, useUser } from "@/features/data/hooks";
import type { UserProfile } from "@/features/data/types";
import { useShare } from "@/features/feed/PostBits";
import { PostCard } from "@/features/feed/PostCard";
import { badgesOf, levelOf, replyLabel } from "@/features/feed/gamify";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { DEMO_USERNAME, useMe } from "@/features/feed/me";
import { Initial, Pill, Stars, TrustRing } from "@/features/feed/parts";
import { eduOf } from "@/features/feed/types";
import { Button, cn } from "@/shared/components/ui";
import {
  BadgeCheck,
  Check,
  Circle,
  Clock,
  Flag,
  Gift,
  GraduationCap,
  HandHeart,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  School,
  Share2,
  Star,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useParams, useSearchParams } from "react-router";

type Tab = "offers" | "needs" | "thanks" | "reviews";

export function ProfilePage({ own = false }: { own?: boolean }) {
  const { username = DEMO_USERNAME } = useParams();
  const { data: u, isLoading, error, refetch } = useUser(own ? DEMO_USERNAME : username);
  const tr = useTr();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5">
      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        {u ? (
          <ProfileView u={u} own={own || username === DEMO_USERNAME} />
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            {tr("প্রোফাইল পাওয়া যায়নি", "Profile not found")}
          </p>
        )}
      </QueryState>
    </div>
  );
}

function ProfileView({ u, own }: { u: UserProfile; own: boolean }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const me = useMe();
  const [params, setParams] = useSearchParams();
  const tab =
    (["offers", "needs", "thanks", "reviews"] as const).find((t) => t === params.get("tab")) ??
    "offers";
  const setTab = (t: Tab) => setParams(t === "offers" ? {} : { tab: t }, { replace: true });
  const { share, copied } = useShare();
  const { data: all = [] } = useFeed({
    kind: "all",
    category: "all",
    scope: "country",
    showGiven: true,
  });
  const posts = all.filter((p) => p.author.username === u.username);
  const offers = posts.filter((p) => p.kind === "offer");
  const needs = posts.filter((p) => p.kind === "need");

  const s = u.stats;
  const lv = levelOf(s.given);
  // Own profile shows my saved study info; others show only what they made public.
  const level = own ? me.level : u.level;
  const edu = eduOf(level);
  const institution = own ? (me.showInstitution ? me.institution : "") : u.institution;
  const reply = replyLabel(s.responseMins, tr);
  const badges = badgesOf(s);
  const shown = own ? badges : badges.filter((b) => b.done);
  const avg = u.reviews.length
    ? u.reviews.reduce((a, r) => a + r.stars, 0) / u.reviews.length
    : null;

  const checklist = [
    { done: true, label: tr("ইমেইল যাচাই", "Email verified") },
    { done: true, label: tr("ঠিকানা যোগ", "Address added") },
    { done: true, label: tr("ফোন নম্বর", "Phone number") },
    { done: !!me.level, label: tr("কী পড়েন জানান", "Add what you study") },
    { done: !!u.bio, label: tr("নিজের সম্পর্কে দুই লাইন", "A two-line bio") },
    { done: false, label: tr("প্রোফাইল ছবি দিন", "Add a profile photo") },
  ];
  const pct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <div className="space-y-5">
      <Helmet>
        <title>{u.name} — ReuseDo</title>
      </Helmet>

      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-24 bg-gradient-to-r from-primary/80 via-primary/60 to-offer/60 sm:h-32" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <Initial
              name={u.name}
              className="h-20 w-20 border-4 border-card text-3xl sm:h-24 sm:w-24 sm:text-4xl"
            />
            <div className="ml-auto flex gap-2 pb-1">
              {own ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/profile/edit">
                    <Pencil className="mr-1.5 h-4 w-4" /> {tr("এডিট", "Edit")}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/messages">
                    <MessageCircle className="mr-1.5 h-4 w-4" /> {tr("মেসেজ", "Message")}
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-9 px-0"
                aria-label={copied ? tr("লিংক কপি হয়েছে", "Link copied") : tr("শেয়ার", "Share")}
                onClick={() => share(u.name, `/users/${u.username}`)}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
              {!own && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-9 px-0"
                  aria-label={tr("রিপোর্ট", "Report")}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-1.5 text-2xl font-extrabold">
                <span className="truncate">{u.name}</span>
                {u.verified && (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-primary" aria-label="verified" />
                )}
              </h1>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {lv.emoji} {lang === "bn" ? lv.bn : lv.en}
                </span>
                {edu && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5" /> {lang === "bn" ? edu.bn : edu.en}
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" /> {u.area}, {u.district} ·{" "}
                  {tr("সদস্য", "Member since")} {u.joined}
                </li>
                {institution && (
                  <li className="flex items-center gap-1.5">
                    <School className="h-4 w-4 shrink-0" /> {institution}
                  </li>
                )}
                {reply && (
                  <li className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" /> {reply}
                  </li>
                )}
              </ul>
            </div>
            <TrustRing value={u.trust} />
          </div>

          {u.bio && <p className="mt-3 text-[15px] leading-relaxed">{u.bio}</p>}
          {u.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {u.badges.map((b) => (
                <Pill key={b} tone="success">
                  ✓ {b}
                </Pill>
              ))}
            </div>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: Gift, v: num(s.given), l: tr("দিয়েছেন", "Given"), tone: "text-offer" },
              {
                icon: HandHeart,
                v: num(s.received),
                l: tr("পেয়েছেন", "Received"),
                tone: "text-need",
              },
              {
                icon: Heart,
                v: num(s.thanksReceived),
                l: tr("ধন্যবাদ", "Thank-yous"),
                tone: "text-destructive",
              },
              {
                icon: Star,
                v: avg === null ? "—" : num(avg.toFixed(1)),
                l: tr("গড় রেটিং", "Avg rating"),
                tone: "text-need",
              },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-muted/60 p-3 text-center">
                <dd className="flex items-center justify-center gap-1 text-xl font-extrabold">
                  <x.icon className={cn("h-4 w-4", x.tone)} />
                  {x.v}
                </dd>
                <dt className="text-xs text-muted-foreground">{x.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4 lg:order-1">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1" role="tablist">
            {(
              [
                ["offers", tr("দিচ্ছেন", "Giving"), offers.length],
                ["needs", tr("চাইছেন", "Needs"), needs.length],
                ["thanks", tr("ধন্যবাদ", "Thanks"), u.thanks.length],
                ["reviews", tr("রিভিউ", "Reviews"), u.reviews.length],
              ] as const
            ).map(([k, l, n]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "rounded-lg px-1 py-2 text-sm font-semibold",
                  tab === k ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                {l} <span className="text-xs opacity-70">{num(n)}</span>
              </button>
            ))}
          </div>

          {tab === "offers" || tab === "needs" ? (
            <div className="space-y-4">
              {(tab === "offers" ? offers : needs).length ? (
                (tab === "offers" ? offers : needs).map((p) => <PostCard key={p.id} post={p} />)
              ) : (
                <Empty
                  text={
                    own
                      ? tab === "offers"
                        ? tr(
                            "এখনো কিছু দেননি — একটা ছবি তুলেই শুরু করুন",
                            "Nothing given yet — start with one photo",
                          )
                        : tr("কিছু দরকার হলে লিখে পোস্ট করুন", "Need something? Just post it")
                      : tr("কোনো পোস্ট নেই", "No posts yet")
                  }
                  cta={
                    own
                      ? {
                          to: tab === "offers" ? "/post/new" : "/post/new?kind=need",
                          label: tr("পোস্ট করুন", "Post"),
                        }
                      : undefined
                  }
                />
              )}
            </div>
          ) : tab === "thanks" ? (
            u.thanks.length ? (
              <ul className="space-y-3">
                {u.thanks.map((n) => (
                  <li key={n.by + n.when + n.text} className="rounded-2xl border bg-card p-4">
                    <p className="leading-relaxed">💌 “{n.text}”</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      — {n.by} · {n.item} · {n.when}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text={tr("এখনো কোনো ধন্যবাদ নোট নেই", "No thank-you notes yet")} />
            )
          ) : u.reviews.length ? (
            <ul className="space-y-3">
              {u.reviews.map((r) => (
                <li key={r.by + r.when} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{r.by}</span>
                    <Stars value={r.stars} />
                  </div>
                  <p className="mt-1 text-sm">{r.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.when}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text={tr("এখনো কোনো রিভিউ নেই", "No reviews yet")} />
          )}
        </div>

        <aside className="space-y-4 lg:order-2">
          {own && (
            <section className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{tr("প্রোফাইল", "Profile")}</h2>
                <span className="text-sm font-bold text-primary">{num(pct)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {tr(
                  "সম্পূর্ণ প্রোফাইলে মানুষ বেশি ভরসা করে, তাড়াতাড়ি জিনিস পাওয়া যায়।",
                  "Complete profiles get more trust — and things faster.",
                )}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2">
                    {c.done ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    {c.done ? (
                      <span>{c.label}</span>
                    ) : (
                      <Link
                        to="/profile/edit"
                        className="text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {c.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-4">
            <h2 className="font-bold">{tr("অর্জন", "Achievements")}</h2>
            {own && lv.next && (
              <p className="mt-1 text-sm text-muted-foreground">
                {tr(
                  `আর ${num(lv.toNext)}টি দিলেই ${lv.next.emoji} ${lv.next.bn}`,
                  `${lv.toNext} more gifts to ${lv.next.emoji} ${lv.next.en}`,
                )}
              </p>
            )}
            {shown.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {tr("এখনো কোনো অর্জন নেই", "No achievements yet")}
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {shown.map((b) => (
                  <li
                    key={b.id}
                    className={cn(
                      "rounded-xl border p-2.5",
                      b.done ? "bg-primary/5" : "bg-muted/40",
                    )}
                    title={tr(b.howBn, b.howEn)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-xl", !b.done && "grayscale opacity-50")}>
                        {b.emoji}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 truncate text-xs font-bold",
                          !b.done && "text-muted-foreground",
                        )}
                      >
                        {tr(b.bn, b.en)}
                      </span>
                      {!b.done && (
                        <Lock className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {!b.done && (
                      <>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(b.value / b.target) * 100}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                          {tr(b.howBn, b.howEn)}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-4 text-sm">
            <h2 className="mb-1 font-bold">🌍 {tr("পরিবেশে অবদান", "For the planet")}</h2>
            <p className="text-muted-foreground">
              {tr(
                `আনুমানিক ${num(Math.round(s.kgSaved))} কেজি জিনিস ফেলে না দিয়ে কাজে লেগেছে।`,
                `About ${Math.round(s.kgSaved)} kg of things reused instead of thrown away.`,
              )}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta?: { to: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed py-12 text-center">
      <p className="text-muted-foreground">{text}</p>
      {cta && (
        <Button asChild className="mt-3">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
