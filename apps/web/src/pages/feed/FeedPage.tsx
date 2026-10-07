import { QueryState } from "@/features/data/QueryState";
import { advancedCount, matchesFilters } from "@/features/data/filtering";
import { useAdConfig, useFeed } from "@/features/data/hooks";
import { AdCard } from "@/features/feed/AdCard";
import { CategoryStrip, FeedToolbar } from "@/features/feed/FeedFilters";
import { FeedRail } from "@/features/feed/FeedRail";
import { ActiveFilters, FilterButton, FilterSheet } from "@/features/feed/FilterSheet";
import { PostCard } from "@/features/feed/PostCard";
import { RESET_ADVANCED, useFeedParams } from "@/features/feed/feedParams";
import { useT, useTr } from "@/features/feed/i18n";
import type { CategoryId } from "@/features/feed/types";
import { Button } from "@/shared/components/ui";
import { Camera, HandHeart } from "lucide-react";
import { Fragment, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

export function FeedPage() {
  const t = useT();
  const tr = useTr();
  const { filters, update } = useFeedParams();
  const [sheet, setSheet] = useState(false);

  const { data: posts = [], isLoading, error, refetch } = useFeed(filters);
  // Unfiltered list so the filter sheet can show "Show N posts" before applying.
  const { data: everything = [] } = useFeed({
    kind: "all",
    category: "all",
    scope: "country",
    showGiven: true,
  });
  // Frequency and per-page cap come from the admin Ads manager.
  const { data: ads } = useAdConfig("feed");
  const every = ads?.enabled ? Math.max(3, ads.every) : 0;
  const adAfter = (i: number) =>
    every > 0 &&
    (i + 1) % every === 0 &&
    i + 1 < posts.length &&
    (i + 1) / every <= (ads?.sessionCap ?? 0);

  return (
    <div className="mx-auto flex w-full max-w-[64rem] justify-center gap-6 px-4 py-4">
      <div className="w-full min-w-0 max-w-2xl space-y-4">
        <Helmet>
          <title>ReuseDo — {t("feed")}</title>
        </Helmet>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/post/new"
            className="flex items-center gap-2.5 rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:border-offer/40 hover:bg-offer-soft/50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-offer-soft text-offer">
              <Camera className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{tr("কিছু দিন", "Give something")}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {tr("ছবি তুলে ১ মিনিটে", "Photo, 1 minute")}
              </span>
            </span>
          </Link>
          <Link
            to="/post/new?kind=need"
            className="flex items-center gap-2.5 rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:border-need/40 hover:bg-need-soft/50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-need-soft text-need">
              <HandHeart className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{tr("কিছু চান", "Ask for something")}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {tr("লিখেই পোস্ট", "Just type it")}
              </span>
            </span>
          </Link>
        </div>

        <CategoryStrip
          value={filters.category as CategoryId | "all"}
          onChange={(c) => update({ category: c })}
        />
        <FeedToolbar
          kind={filters.kind}
          onKind={(k) => update({ kind: k })}
          scope={filters.scope}
          onScope={(s) => update({ scope: s })}
          extra={<FilterButton count={advancedCount(filters)} onClick={() => setSheet(true)} />}
        />
        <ActiveFilters filters={filters} onChange={update} />

        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-14 text-center">
              <div className="mb-2 text-4xl">🔍</div>
              <p className="font-semibold">
                {tr("এই ফিল্টারে কিছু নেই", "Nothing matches these filters")}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                {tr(
                  "ফিল্টার কমিয়ে দেখুন, অথবা নিজেই পোস্ট করুন — কেউ হয়তো দিতে চাইছেন।",
                  "Loosen the filters, or post it yourself — someone may want to give.",
                )}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    update({
                      ...RESET_ADVANCED,
                      kind: "all",
                      category: "all",
                      scope: "country",
                      q: undefined,
                    })
                  }
                >
                  {tr("ফিল্টার মুছুন", "Clear filters")}
                </Button>
                <Button asChild>
                  <Link to="/post/new?kind=need">
                    {tr("আমার দরকার — পোস্ট করি", "Post what I need")}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            posts.map((p, i) => (
              <Fragment key={p.id}>
                <PostCard post={p} />
                {adAfter(i) && <AdCard placement="feed" slot={(i + 1) / every - 1} />}
              </Fragment>
            ))
          )}
        </QueryState>
      </div>
      <FeedRail />
      <FilterSheet
        open={sheet}
        onOpenChange={setSheet}
        filters={filters}
        onApply={update}
        resultCount={(f) => everything.filter((p) => matchesFilters(p, f)).length}
      />
    </div>
  );
}
