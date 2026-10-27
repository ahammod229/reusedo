import { QueryState } from "@/features/data/QueryState";
import { advancedCount, matchesFilters } from "@/features/data/filtering";
import { useAdConfig, useFeed } from "@/features/data/hooks";
import { AdCard } from "@/features/feed/AdCard";
import { Composer } from "@/features/feed/Composer";
import { CategoryStrip, FeedToolbar, chip } from "@/features/feed/FeedFilters";
import { FeedRail } from "@/features/feed/FeedRail";
import { ActiveFilters, FilterButton, FilterSheet } from "@/features/feed/FilterSheet";
import { PostCard } from "@/features/feed/PostCard";
import { type FeedView, RESET_ADVANCED, useFeedParams } from "@/features/feed/feedParams";
import { useT, useTr } from "@/features/feed/i18n";
import type { CategoryId } from "@/features/feed/types";
import { InstallBanner } from "@/features/pwa/InstallBanner";
import { Button, cn } from "@/shared/components/ui";
import { List, Map as MapIcon } from "lucide-react";
import { Fragment, Suspense, lazy, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

// Leaflet is ~150 KB; only load it when someone opens the map.
const PostMap = lazy(() => import("@/features/geo/PostMap"));

/** One pill that flips between the list and the map. */
function ViewToggle({ view, onChange }: { view: FeedView; onChange: (v: FeedView) => void }) {
  const tr = useTr();
  const toMap = view === "list";
  return (
    <button
      type="button"
      onClick={() => onChange(toMap ? "map" : "list")}
      className={chip(!toMap)}
      aria-pressed={!toMap}
    >
      {toMap ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
      {toMap ? tr("ম্যাপে দেখুন", "Map") : tr("তালিকা", "List")}
    </button>
  );
}

export function FeedPage() {
  const t = useT();
  const tr = useTr();
  const { filters, update, view, setView } = useFeedParams();
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
    <div
      className={cn(
        // Phones: posts run edge to edge with thin grey gaps between them, like a social feed.
        "mx-auto flex w-full justify-center gap-6 pb-4 sm:px-4 sm:pt-4",
        view === "map" ? "max-w-6xl" : "max-w-[64rem]",
      )}
    >
      <div className={cn("w-full min-w-0 space-y-2 sm:space-y-4", view === "list" && "max-w-2xl")}>
        <Helmet>
          <title>ReuseDo — {t("feed")}</title>
        </Helmet>

        {view === "list" && <Composer />}
        {view === "list" && <InstallBanner />}

        <section className="space-y-2.5 bg-card px-4 py-3 sm:bg-transparent sm:p-0">
          <FeedToolbar
            kind={filters.kind}
            onKind={(k) => update({ kind: k })}
            scope={filters.scope}
            onScope={(s) => update({ scope: s })}
            extra={
              <>
                <ViewToggle view={view} onChange={setView} />
                <FilterButton count={advancedCount(filters)} onClick={() => setSheet(true)} />
              </>
            }
          />
          <CategoryStrip
            value={filters.category as CategoryId | "all"}
            onChange={(c) => update({ category: c })}
          />
          <ActiveFilters filters={filters} onChange={update} />
        </section>

        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {view === "map" ? (
            <Suspense
              fallback={<div className="h-[min(70vh,640px)] animate-pulse rounded-3xl bg-muted" />}
            >
              <PostMap
                posts={posts}
                className="h-[calc(100dvh-16rem)] min-h-[24rem] md:h-[calc(100dvh-17rem)]"
              />
            </Suspense>
          ) : posts.length === 0 ? (
            <div className="mx-4 rounded-2xl border border-dashed bg-card py-14 text-center sm:mx-0">
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
                <PostCard post={p} flush />
                {adAfter(i) && <AdCard placement="feed" slot={(i + 1) / every - 1} />}
              </Fragment>
            ))
          )}
        </QueryState>
      </div>
      {view === "list" && <FeedRail />}
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
