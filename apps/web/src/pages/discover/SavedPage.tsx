import { QueryState } from "@/features/data/QueryState";
import { useFeed } from "@/features/data/hooks";
import { PostCard } from "@/features/feed/PostCard";
import { useTr } from "@/features/feed/i18n";
import { PageHeading } from "@/features/feed/parts";
import { useSaved } from "@/features/feed/saved";
import { Button } from "@/shared/components/ui";
import { Bookmark } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

export function SavedPage() {
  const tr = useTr();
  const ids = useSaved((s) => s.ids);
  const {
    data: all = [],
    isLoading,
    error,
    refetch,
  } = useFeed({ kind: "all", category: "all", scope: "country" });
  const saved = all.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
      <Helmet>
        <title>{tr("সেভ করা", "Saved")} — ReuseDo</title>
      </Helmet>
      <PageHeading title={tr("সেভ করা পোস্ট", "Saved posts")} />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {saved.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Bookmark className="mx-auto mb-3 h-10 w-10" />
            <p>{tr("এখনও কিছু সেভ করেননি", "Nothing saved yet")}</p>
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
        )}
      </QueryState>
    </div>
  );
}
