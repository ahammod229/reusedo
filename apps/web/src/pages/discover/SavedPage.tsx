import { QueryState } from "@/features/data/QueryState";
import { matchesFilters } from "@/features/data/filtering";
import { useFeed } from "@/features/data/hooks";
import { PostCard } from "@/features/feed/PostCard";
import { useAlerts } from "@/features/feed/alerts";
import { toParams } from "@/features/feed/feedParams";
import { useNum, useTr } from "@/features/feed/i18n";
import { PageHeading } from "@/features/feed/parts";
import { useSaved } from "@/features/feed/saved";
import { Button, cn } from "@/shared/components/ui";
import { Bell, Bookmark, Trash2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router";

export function SavedPage() {
  const tr = useTr();
  const num = useNum();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "searches" ? "searches" : "posts";
  const ids = useSaved((s) => s.ids);
  const alerts = useAlerts();
  const {
    data: all = [],
    isLoading,
    error,
    refetch,
  } = useFeed({ kind: "all", category: "all", scope: "country", showGiven: true });
  const saved = all.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
      <Helmet>
        <title>{tr("সেভ করা", "Saved")} — ReuseDo</title>
      </Helmet>
      <PageHeading title={tr("সেভ করা", "Saved")} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {(
          [
            ["posts", tr("পোস্ট", "Posts"), saved.length],
            ["searches", tr("সেভ করা খোঁজ", "Saved searches"), alerts.list.length],
          ] as const
        ).map(([k, l, n]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setParams(k === "posts" ? {} : { tab: k }, { replace: true })}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold",
              tab === k ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {l} <span className="text-xs opacity-70">{num(n)}</span>
          </button>
        ))}
      </div>

      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {tab === "posts" ? (
          saved.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Bookmark className="mx-auto mb-3 h-10 w-10" />
              <p>{tr("এখনও কিছু সেভ করেননি", "Nothing saved yet")}</p>
              <p className="mt-1 text-sm">
                {tr("পোস্টের 🔖 চাপলে এখানে থাকবে", "Tap 🔖 on a post to keep it here")}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/feed">{tr("ফিড দেখুন", "Browse feed")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {saved.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )
        ) : alerts.list.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Bell className="mx-auto mb-3 h-10 w-10" />
            <p>{tr("কোনো খোঁজ সেভ করা নেই", "No saved searches")}</p>
            <p className="mx-auto mt-1 max-w-xs text-sm">
              {tr(
                "ফিডে ফিল্টার দিয়ে “এই খোঁজ সেভ করুন” চাপুন — মিলে গেলে জানাব।",
                "Filter the feed and tap “Save this search” — we'll tell you when something matches.",
              )}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/feed">{tr("ফিডে যান", "Go to feed")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.list.map((a) => {
              const matches = all.filter((p) => matchesFilters(p, a.filters));
              const fresh = matches.filter((p) => p.hoursAgo <= 72).length;
              return (
                <li key={a.id} className="flex items-center gap-2 rounded-2xl border bg-card p-3">
                  <Link
                    to={`/feed?${toParams(a.filters)}`}
                    className="min-w-0 flex-1 rounded-xl p-1 hover:bg-accent/50"
                  >
                    <p className="truncate font-semibold">{a.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {tr(`${num(matches.length)}টি মিলছে`, `${matches.length} matching`)}
                      {fresh > 0 && (
                        <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 font-bold text-primary-foreground">
                          {tr(`${num(fresh)} নতুন`, `${fresh} new`)}
                        </span>
                      )}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 shrink-0 px-0 text-muted-foreground"
                    aria-label={tr(`${a.label} মুছুন`, `Delete ${a.label}`)}
                    onClick={() => alerts.remove(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
