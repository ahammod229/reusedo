import { QueryState } from "@/features/data/QueryState";
import { advancedCount, matchesFilters } from "@/features/data/filtering";
import { useFeed } from "@/features/data/hooks";
import { ActiveFilters, FilterButton, FilterSheet } from "@/features/feed/FilterSheet";
import { PostCard } from "@/features/feed/PostCard";
import { useFeedParams } from "@/features/feed/feedParams";
import { useLang, useTr } from "@/features/feed/i18n";
import { PageHeading } from "@/features/feed/parts";
import { CATEGORIES } from "@/features/feed/types";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

const SUGGEST_BN = ["বই", "টেবিল", "কাপড়", "খাতা", "ল্যাপটপ"];
const SUGGEST_EN = ["books", "table", "clothes", "notebook", "laptop"];

export function SearchPage() {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const { filters, update } = useFeedParams();
  const [sheet, setSheet] = useState(false);
  const urlQ = filters.q ?? "";
  const [text, setText] = useState(urlQ);
  useEffect(() => setText(urlQ), [urlQ]);

  const { data: results = [], isLoading, error, refetch } = useFeed(filters);
  const { data: everything = [] } = useFeed({
    kind: "all",
    category: "all",
    scope: "country",
    showGiven: true,
  });
  const submit = (v: string) => update({ q: v.trim() || undefined });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
      <Helmet>
        <title>{tr("খুঁজুন", "Search")} — ReuseDo</title>
      </Helmet>
      <PageHeading title={tr("খুঁজুন", "Search")} />
      <div className="flex items-center gap-2">
        <form
          // biome-ignore lint/a11y/useSemanticElements: a search landmark needs the form, not just the input
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            type="search"
            enterKeyHint="search"
            placeholder={tr("বই, টেবিল, কাপড় খুঁজুন…", "Search books, tables, clothes…")}
            aria-label={tr("খুঁজুন", "Search")}
            className="h-12 w-full rounded-full border bg-card pl-12 pr-12 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
          {text && (
            <button
              type="button"
              aria-label={tr("মুছুন", "Clear")}
              onClick={() => {
                setText("");
                submit("");
              }}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <FilterButton count={advancedCount(filters)} onClick={() => setSheet(true)} />
      </div>
      <ActiveFilters filters={filters} onChange={update} />

      {!urlQ &&
      advancedCount(filters) === 0 &&
      filters.category === "all" &&
      filters.kind === "all" ? (
        <div className="space-y-5">
          <div>
            <h2 className="mb-2 text-sm font-bold text-muted-foreground">
              {tr("জনপ্রিয় খোঁজ", "Popular searches")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(lang === "bn" ? SUGGEST_BN : SUGGEST_EN).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-muted-foreground">
              {tr("ক্যাটাগরি", "Categories")}
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => update({ category: c.id })}
                    className={`flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br p-4 text-left font-semibold ${c.tone}`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-foreground">{lang === "bn" ? c.bn : c.en}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          <p className="text-sm text-muted-foreground">
            {urlQ && `“${urlQ}” — `}
            {tr(`${results.length}টি ফল`, `${results.length} results`)}
          </p>
          {results.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="mb-2 text-4xl">🔍</p>
              {tr("কিছু পাওয়া যায়নি। অন্য শব্দে খুঁজুন।", "Nothing found. Try different words.")}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </QueryState>
      )}
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
