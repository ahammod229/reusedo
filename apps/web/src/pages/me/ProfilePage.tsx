import { PostCard } from "@/features/feed/PostCard";
import { useNum, useTr } from "@/features/feed/i18n";
import { QueryState } from "@/features/data/QueryState";
import { useFeed, useUser } from "@/features/data/hooks";
import type { UserProfile } from "@/features/data/types";
import { Initial, Pill, Stars, TrustRing } from "@/features/feed/parts";
import { Button, cn } from "@/shared/components/ui";
import {
  BadgeCheck,
  Check,
  Circle,
  Flag,
  Gift,
  HandHeart,
  MapPin,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router";

export function ProfilePage({ own = false }: { own?: boolean }) {
  const { username = "rakib" } = useParams();
  const { data: u, isLoading, error, refetch } = useUser(own ? "rakib" : username);
  const tr = useTr();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5">
      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        {u ? (
          <ProfileView u={u} own={own} />
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
  const [tab, setTab] = useState<"posts" | "reviews">("posts");
  const { data: all = [] } = useFeed({ kind: "all", category: "all", scope: "country" });
  const posts = all.filter((p) => p.author.name === u.name);

  const checklist = [
    { done: true, label: tr("ইমেইল যাচাই", "Email verified") },
    { done: true, label: tr("ঠিকানা যোগ", "Address added") },
    { done: true, label: tr("ফোন নম্বর", "Phone number") },
    { done: false, label: tr("প্রোফাইল ছবি দিন", "Add a profile photo") },
  ];
  const avg = (u.reviews.reduce((a, r) => a + r.stars, 0) / u.reviews.length).toFixed(1);

  return (
    <div className="space-y-5">
      <Helmet>
        <title>{u.name} — ReuseDo</title>
      </Helmet>

      <section className="rounded-3xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <Initial name={u.name} className="h-20 w-20 text-3xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 text-xl font-extrabold">
              <span className="truncate">{u.name}</span>
              {u.verified && <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />}
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {u.area}, {u.district}
            </p>
            <p className="text-xs text-muted-foreground">
              {tr("সদস্য", "Member since")} {u.joined}
            </p>
          </div>
          <TrustRing value={u.trust} />
        </div>
        <p className="mt-4 text-[15px] leading-relaxed">{u.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {u.badges.map((b) => (
            <Pill key={b} tone="success">
              ✓ {b}
            </Pill>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x rounded-2xl bg-muted/60 py-3 text-center">
          <div>
            <p className="flex items-center justify-center gap-1 text-xl font-extrabold">
              <Gift className="h-4 w-4 text-offer" />
              {num(u.given)}
            </p>
            <p className="text-xs text-muted-foreground">{tr("দিয়েছেন", "Given")}</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-xl font-extrabold">
              <HandHeart className="h-4 w-4 text-need" />
              {num(u.received)}
            </p>
            <p className="text-xs text-muted-foreground">{tr("পেয়েছেন", "Received")}</p>
          </div>
          <div>
            <p className="text-xl font-extrabold">{num(avg)}</p>
            <p className="text-xs text-muted-foreground">{tr("গড় রেটিং", "Avg rating")}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {own ? (
            <>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" /> {tr("সেটিংস ও এডিট", "Edit & settings")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="flex-1">
                <Link to="/messages/c1">
                  <MessageCircle className="mr-2 h-4 w-4" /> {tr("মেসেজ", "Message")}
                </Link>
              </Button>
              <Button variant="outline" aria-label={tr("রিপোর্ট", "Report")}>
                <Flag className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </section>

      {own && (
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="font-bold">{tr("প্রোফাইল সম্পূর্ণতা", "Profile completeness")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                {c.done ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(!c.done && "text-muted-foreground")}>{c.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {(
          [
            ["posts", tr("পোস্ট", "Posts")],
            ["reviews", tr("রিভিউ", "Reviews")],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold",
              tab === k ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <div className="space-y-4">
          {posts.length ? (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <p className="py-10 text-center text-muted-foreground">
              {tr("কোনো পোস্ট নেই", "No posts yet")}
            </p>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
