import { AdCard } from "@/features/feed/AdCard";
import { PostCard } from "@/features/feed/PostCard";
import { useLang, useT } from "@/features/feed/i18n";
import { MOCK_POSTS } from "@/features/feed/mock";
import { CATEGORIES, type CategoryId, type PostKind } from "@/features/feed/types";
import { Button, cn } from "@/shared/components/ui";
import { Camera } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

// An ad is injected after every N posts; keep in sync with the
// `ads_frequency` platform setting once it is wired to the API.
const AD_EVERY = 6;
type Scope = "area" | "district" | "country";

export function FeedPage() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const [kind, setKind] = useState<PostKind | "all">("all");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [scope, setScope] = useState<Scope>("country");

  const posts = useMemo(
    () =>
      MOCK_POSTS.filter((p) => kind === "all" || p.kind === kind)
        .filter((p) => cat === "all" || p.category === cat)
        .filter((p) =>
          scope === "area" ? p.distanceKm <= 5 : scope === "district" ? p.district === "ঢাকা" : true,
        )
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [kind, cat, scope],
  );

  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background hover:bg-accent",
    );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
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

      <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "offer", "need"] as const).map((k) => (
            <button type="button" key={k} className={chip(kind === k)} onClick={() => setKind(k)}>
              {k === "all" ? t("all") : k === "offer" ? `🎁 ${t("give")}` : `🙏 ${t("need")}`}
            </button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-border" />
          {(["area", "district", "country"] as const).map((s) => (
            <button type="button" key={s} className={chip(scope === s)} onClick={() => setScope(s)}>
              {s === "area" ? t("nearMe") : s === "district" ? t("district") : t("country")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" className={chip(cat === "all")} onClick={() => setCat("all")}>
            {t("all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={chip(cat === c.id)}
              onClick={() => setCat(c.id)}
            >
              {c.emoji} {lang === "bn" ? c.bn : c.en}
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
