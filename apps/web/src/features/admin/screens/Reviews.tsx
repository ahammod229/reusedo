import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Pill, Stars } from "@/features/feed/parts";
import { Button } from "@/shared/components/ui";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminReviews, useDeleteReview } from "../data/hooks";
import type { AdminReview } from "../data/types";
import { AdminPage, ConfirmDialog, DataTable, FilterTabs } from "../kit";

type F = "all" | "flagged";

export function Reviews() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminReviews();
  const del = useDeleteReview();
  const [f, setF] = useState<F>("all");
  const [target, setTarget] = useState<AdminReview | null>(null);
  const rows = data.filter((r) => f === "all" || r.flagged);

  return (
    <AdminPage
      title={tr("রিভিউ", "Reviews")}
      desc={tr("অশালীন বা ভুয়া রিভিউ মুছে ফেলুন", "Remove abusive or fake reviews")}
    >
      <Helmet>
        <title>{tr("রিভিউ", "Reviews")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<F>
        value={f}
        onChange={setF}
        options={[
          { value: "all", label: tr("সব", "All"), count: data.length },
          {
            value: "flagged",
            label: tr("চিহ্নিত", "Flagged"),
            count: data.filter((r) => r.flagged).length,
          },
        ]}
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          cols={[
            {
              key: "text",
              header: tr("রিভিউ", "Review"),
              primary: true,
              cell: (r) => <span className="font-normal">“{r.text}”</span>,
            },
            { key: "from", header: tr("কে দিয়েছে", "From"), cell: (r) => r.from },
            { key: "to", header: tr("কাকে", "To"), cell: (r) => r.to },
            { key: "stars", header: tr("রেটিং", "Rating"), cell: (r) => <Stars value={r.stars} /> },
            {
              key: "flag",
              header: tr("অবস্থা", "State"),
              cell: (r) =>
                r.flagged ? (
                  <Pill tone="danger">{tr("চিহ্নিত", "Flagged")}</Pill>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (r) => (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setTarget(r)}
                >
                  {tr("মুছুন", "Delete")}
                </Button>
              ),
            },
          ]}
        />
      </QueryState>
      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        danger
        title={tr("রিভিউ মুছে ফেলবেন?", "Delete this review?")}
        desc={target ? `“${target.text}”` : undefined}
        confirmLabel={tr("মুছে ফেলুন", "Delete")}
        onConfirm={() => target && del.mutate(target.id)}
      />
    </AdminPage>
  );
}
