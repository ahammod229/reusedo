import { QueryState } from "@/features/data/QueryState";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { categoryOf } from "@/features/feed/types";
import { Button } from "@/shared/components/ui";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { useAdminPosts, useSetPostStatus } from "../data/hooks";
import type { AdminPost } from "../data/types";
import { AdminPage, ConfirmDialog, DataTable, FilterTabs, SearchBox } from "../kit";

type F = "all" | "reported" | "hidden" | "deleted";

export function Posts() {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const { data = [], isLoading, error, refetch } = useAdminPosts();
  const setStatus = useSetPostStatus();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [del, setDel] = useState<AdminPost | null>(null);

  const rows = useMemo(
    () =>
      data
        .filter((p) =>
          f === "all"
            ? p.status !== "deleted"
            : f === "reported"
              ? p.reports > 0 && p.status !== "deleted"
              : p.status === f,
        )
        .filter((p) => !q || `${p.title} ${p.author}`.toLowerCase().includes(q.toLowerCase())),
    [data, f, q],
  );
  const n = (fn: (p: AdminPost) => boolean) => data.filter(fn).length;
  const statusPill = (s: AdminPost["status"]) =>
    s === "published" ? (
      <Pill tone="success">{tr("চালু", "Live")}</Pill>
    ) : s === "hidden" ? (
      <Pill tone="warning">{tr("লুকানো", "Hidden")}</Pill>
    ) : (
      <Pill tone="danger">{tr("মুছে ফেলা", "Deleted")}</Pill>
    );

  return (
    <AdminPage
      title={tr("পোস্ট মডারেশন", "Post moderation")}
      desc={tr("‘দিচ্ছি’ ও ‘চাই’ সব পোস্ট এক জায়গায়", "All offers and needs in one place")}
    >
      <Helmet>
        <title>{tr("পোস্ট", "Posts")} — ReuseDo Admin</title>
      </Helmet>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs<F>
          value={f}
          onChange={setF}
          options={[
            { value: "all", label: tr("সব", "All"), count: n((p) => p.status !== "deleted") },
            {
              value: "reported",
              label: tr("রিপোর্ট আছে", "Reported"),
              count: n((p) => p.reports > 0 && p.status !== "deleted"),
            },
            {
              value: "hidden",
              label: tr("লুকানো", "Hidden"),
              count: n((p) => p.status === "hidden"),
            },
            {
              value: "deleted",
              label: tr("মুছে ফেলা", "Deleted"),
              count: n((p) => p.status === "deleted"),
            },
          ]}
        />
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder={tr("শিরোনাম বা লেখক…", "Title or author…")}
        />
      </div>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={rows}
          rowKey={(p) => p.id}
          cols={[
            {
              key: "title",
              header: tr("পোস্ট", "Post"),
              primary: true,
              cell: (p) => (
                <Link
                  to={`/post/${p.id.replace("p", "")}`}
                  className="font-semibold hover:underline"
                >
                  {p.kind === "offer" ? "🎁" : "🙏"} {p.title}
                </Link>
              ),
            },
            { key: "author", header: tr("লেখক", "Author"), cell: (p) => p.author },
            {
              key: "cat",
              header: tr("ক্যাটাগরি", "Category"),
              cell: (p) =>
                `${categoryOf(p.category).emoji} ${lang === "bn" ? categoryOf(p.category).bn : categoryOf(p.category).en}`,
            },
            {
              key: "reports",
              header: tr("রিপোর্ট", "Reports"),
              cell: (p) =>
                p.reports ? (
                  <Pill tone="danger">{num(p.reports)}</Pill>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            { key: "created", header: tr("কখন", "When"), cell: (p) => p.created },
            { key: "status", header: tr("অবস্থা", "Status"), cell: (p) => statusPill(p.status) },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (p) => (
                <>
                  {p.status === "published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ id: p.id, status: "hidden" })}
                    >
                      {tr("লুকান", "Hide")}
                    </Button>
                  )}
                  {p.status !== "published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ id: p.id, status: "published" })}
                    >
                      {tr("পুনরুদ্ধার", "Restore")}
                    </Button>
                  )}
                  {p.status !== "deleted" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDel(p)}
                    >
                      {tr("মুছুন", "Delete")}
                    </Button>
                  )}
                </>
              ),
            },
          ]}
        />
      </QueryState>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        danger
        title={tr("পোস্ট মুছে ফেলবেন?", "Delete this post?")}
        desc={del?.title}
        confirmLabel={tr("মুছে ফেলুন", "Delete")}
        onConfirm={() => del && setStatus.mutate({ id: del.id, status: "deleted" })}
      />
    </AdminPage>
  );
}
