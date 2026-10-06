import { QueryState } from "@/features/data/QueryState";
import { useFeed } from "@/features/data/hooks";
import { Photo } from "@/features/feed/Photo";
import { useNum, useTr } from "@/features/feed/i18n";
import { PageHeading, Pill } from "@/features/feed/parts";
import { Button, cn } from "@/shared/components/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

// "Me" is the mock user until the auth user id is available from the API.
const ME = "রাকিব হাসান";

export function MyPostsPage() {
  const tr = useTr();
  const num = useNum();
  const [tab, setTab] = useState<"offer" | "need">("offer");
  const {
    data: all = [],
    isLoading,
    error,
    refetch,
  } = useFeed({ kind: "all", category: "all", scope: "country" });
  const mine = all.filter((p) => p.author.name === ME && p.kind === tab);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
      <Helmet>
        <title>{tr("আমার পোস্ট", "My posts")} — ReuseDo</title>
      </Helmet>
      <PageHeading
        title={tr("আমার পোস্ট", "My posts")}
        action={
          <Button asChild size="sm">
            <Link to="/post/new">
              <Plus className="mr-1 h-4 w-4" /> {tr("নতুন", "New")}
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {(
          [
            ["offer", `🎁 ${tr("দিচ্ছি", "Giving")}`],
            ["need", `🙏 ${tr("চাইছি", "Asking")}`],
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
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {mine.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            {tr("এখানে কিছু নেই", "Nothing here")}
          </p>
        ) : (
          <ul className="space-y-3">
            {mine.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-2xl border bg-card p-3">
                <Photo post={p} className="h-20 w-20 shrink-0 rounded-xl" emojiSize="text-3xl" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/post/${p.id}`}
                    className="line-clamp-2 font-bold leading-snug hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Pill tone="success">{tr("চালু", "Active")}</Pill>
                    <span>
                      {num(p.requests)} {tr("রিকোয়েস্ট", "requests")}
                    </span>
                    <span>{p.postedAt}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/exchanges">{tr("রিকোয়েস্ট দেখুন", "View requests")}</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
