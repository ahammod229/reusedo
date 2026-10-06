import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { Button, cn } from "@/shared/components/ui";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminPages, useSavePage } from "../data/hooks";
import type { AdminContentPage } from "../data/types";
import { AdminPage, Panel } from "../kit";

/** Edit the text of static pages (terms, privacy, about, help). Drafts are not shown to the public. */
export function Cms() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminPages();
  const [slug, setSlug] = useState<string>("terms");
  const page = data.find((p) => p.slug === slug) ?? data[0];

  return (
    <AdminPage
      title={tr("পেজ কনটেন্ট", "Page content")}
      desc={tr("শর্তাবলী, প্রাইভেসি, আমাদের কথা, সাহায্য", "Terms, privacy, about, help")}
    >
      <Helmet>
        <title>CMS — ReuseDo Admin</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <ul className="flex gap-2 overflow-x-auto scrollbar-none lg:flex-col">
            {data.map((p) => (
              <li key={p.slug} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setSlug(p.slug)}
                  className={cn(
                    "flex w-full min-w-40 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    p.slug === page?.slug
                      ? "border-primary bg-primary/5"
                      : "bg-card hover:bg-accent",
                  )}
                >
                  <span className="font-semibold">{p.title}</span>
                  {p.status === "published" ? (
                    <Pill tone="success">{tr("প্রকাশিত", "Live")}</Pill>
                  ) : (
                    <Pill tone="warning">{tr("খসড়া", "Draft")}</Pill>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {/* key resets the form whenever another page (or a fresh save) is shown */}
          {page && <PageEditor key={`${page.slug}:${page.updated}`} page={page} />}
        </div>
      </QueryState>
    </AdminPage>
  );
}

function PageEditor({ page }: { page: AdminContentPage }) {
  const tr = useTr();
  const save = useSavePage();
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [notice, setNotice] = useState("");
  const dirty = title !== page.title || body !== page.body;
  const submit = (status: AdminContentPage["status"]) => {
    save.mutate({ ...page, title, body, status });
    setNotice(
      status === "published" ? tr("প্রকাশিত ✓", "Published ✓") : tr("খসড়া সংরক্ষিত ✓", "Draft saved ✓"),
    );
  };

  return (
    <Panel>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="cms-title" className="text-sm font-semibold">
            {tr("শিরোনাম", "Title")}
          </label>
          <input
            id="cms-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cms-body" className="text-sm font-semibold">
            {tr("লেখা", "Content")}
          </label>
          <textarea
            id="cms-body"
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-base leading-relaxed outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        {(page.slug === "terms" || page.slug === "privacy") && (
          <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
            ⚠️ {tr("চালুর আগে আইনজীবীকে দিয়ে দেখিয়ে নিন।", "Have a lawyer review this before launch.")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={!dirty} onClick={() => submit("draft")}>
            {tr("খসড়া সংরক্ষণ", "Save draft")}
          </Button>
          <Button
            disabled={!body.trim() || (!dirty && page.status === "published")}
            onClick={() => submit("published")}
          >
            {tr("প্রকাশ করুন", "Publish")}
          </Button>
          {notice && <output className="text-sm font-medium text-success">{notice}</output>}
          <span className="ml-auto text-xs text-muted-foreground">
            {tr("সর্বশেষ", "Updated")}: {page.updated}
          </span>
        </div>
      </div>
    </Panel>
  );
}
