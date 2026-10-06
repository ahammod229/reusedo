import { AdCard } from "@/features/feed/AdCard";
import { PostCard } from "@/features/feed/PostCard";
import { useT } from "@/features/feed/i18n";
import { QueryState } from "@/features/data/QueryState";
import { useFeed } from "@/features/data/hooks";
import type { CategoryId, PostKind } from "@/features/feed/types";
import { Button } from "@/shared/components/ui";
import { Camera } from "lucide-react";
import { Fragment, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router";
import { CategoryStrip, FeedToolbar, type Scope } from "@/features/feed/FeedFilters";
import { FeedRail } from "@/features/feed/FeedRail";

// An ad is injected after every N posts; keep in sync with the
// `ads_frequency` platform setting once it is wired to the API.
const AD_EVERY = 6;

export function FeedPage() {
  const t = useT();
  const [params] = useSearchParams();
  const initialKind = params.get("kind");
  const [kind, setKind] = useState<PostKind | "all">(
    initialKind === "offer" || initialKind === "need" ? initialKind : "all",
  );
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [scope, setScope] = useState<Scope>("country");

  const { data: posts = [], isLoading, error, refetch } = useFeed({ kind, category: cat, scope });

  return (
    <div className="mx-auto flex w-full max-w-[64rem] justify-center gap-6 px-4 py-4">
      <div className="w-full max-w-2xl min-w-0 space-y-4">
        <Helmet>
          <title>ReuseDo — {t("feed")}</title>
        </Helmet>

        <Link
          to="/post/new"
          className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm hover:bg-accent/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <span className="flex-1 text-sm text-muted-foreground">{t("postSomething")}</span>
          <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            {t("takePhoto")}
          </span>
        </Link>

        <CategoryStrip value={cat} onChange={setCat} />
        <FeedToolbar kind={kind} onKind={setKind} scope={scope} onScope={setScope} />

        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {posts.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <div className="mb-2 text-4xl">🔍</div>
              {t("emptyFeed")}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setKind("all");
                    setCat("all");
                    setScope("country");
                  }}
                >
                  {t("all")}
                </Button>
              </div>
            </div>
          ) : (
            posts.map((p, i) => (
              <Fragment key={p.id}>
                <PostCard post={p} />
                {(i + 1) % AD_EVERY === 0 && i + 1 < posts.length && (
                  <AdCard index={(i + 1) / AD_EVERY} />
                )}
              </Fragment>
            ))
          )}
        </QueryState>
      </div>
      <FeedRail />
    </div>
  );
}
