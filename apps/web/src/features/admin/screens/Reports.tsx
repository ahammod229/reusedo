import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminReports, useSetReportStatus } from "../data/hooks";
import type { AdminReport } from "../data/types";
import { AdminPage, DataTable, FilterTabs } from "../kit";

type F = "open" | "investigating" | "closed" | "all";

export function Reports() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminReports();
  const act = useSetReportStatus();
  const [f, setF] = useState<F>("open");
  const [sel, setSel] = useState<AdminReport | null>(null);

  const reason = (r: AdminReport["reason"]) =>
    ({
      spam: tr("স্প্যাম", "Spam"),
      fraud: tr("প্রতারণা", "Fraud"),
      abuse: tr("হয়রানি", "Abuse"),
      fake_item: tr("ভুয়া জিনিস", "Fake item"),
      inappropriate: tr("অনুপযুক্ত", "Inappropriate"),
      other: tr("অন্যান্য", "Other"),
    })[r];
  const type = (t: AdminReport["targetType"]) =>
    ({
      post: tr("পোস্ট", "Post"),
      user: tr("ইউজার", "User"),
      message: tr("মেসেজ", "Message"),
      review: tr("রিভিউ", "Review"),
    })[t];
  const statusPill = (s: AdminReport["status"]) =>
    s === "open" ? (
      <Pill tone="danger">{tr("খোলা", "Open")}</Pill>
    ) : s === "investigating" ? (
      <Pill tone="warning">{tr("তদন্তে", "Investigating")}</Pill>
    ) : s === "resolved" ? (
      <Pill tone="success">{tr("নিষ্পত্তি", "Resolved")}</Pill>
    ) : (
      <Pill>{tr("খারিজ", "Dismissed")}</Pill>
    );

  const rows = useMemo(
    () =>
      data.filter((r) =>
        f === "all"
          ? true
          : f === "closed"
            ? r.status === "resolved" || r.status === "dismissed"
            : r.status === f,
      ),
    [data, f],
  );
  const n = (fn: (r: AdminReport) => boolean) => data.filter(fn).length;
  const done = (status: AdminReport["status"], hideTarget?: boolean) => {
    if (sel) act.mutate({ id: sel.id, status, hideTarget });
    setSel(null);
  };

  return (
    <AdminPage
      title={tr("রিপোর্ট কিউ", "Reports queue")}
      desc={tr(
        "ইউজারদের জানানো সমস্যা — ২৪ ঘণ্টার মধ্যে ব্যবস্থা নিন",
        "Issues reported by users — act within 24 hours",
      )}
    >
      <Helmet>
        <title>{tr("রিপোর্ট", "Reports")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<F>
        value={f}
        onChange={setF}
        options={[
          { value: "open", label: tr("খোলা", "Open"), count: n((r) => r.status === "open") },
          {
            value: "investigating",
            label: tr("তদন্তে", "Investigating"),
            count: n((r) => r.status === "investigating"),
          },
          {
            value: "closed",
            label: tr("নিষ্পত্তি", "Closed"),
            count: n((r) => r.status === "resolved" || r.status === "dismissed"),
          },
          { value: "all", label: tr("সব", "All"), count: data.length },
        ]}
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          empty={tr("🎉 কোনো রিপোর্ট নেই", "🎉 No reports")}
          cols={[
            {
              key: "target",
              header: tr("কিসের বিরুদ্ধে", "Target"),
              primary: true,
              cell: (r) => <span className="font-semibold">{r.targetLabel}</span>,
            },
            { key: "type", header: tr("ধরন", "Type"), cell: (r) => type(r.targetType) },
            { key: "reason", header: tr("কারণ", "Reason"), cell: (r) => reason(r.reason) },
            { key: "reporter", header: tr("কে জানিয়েছে", "Reporter"), cell: (r) => r.reporter },
            { key: "created", header: tr("কখন", "When"), cell: (r) => r.created },
            { key: "status", header: tr("অবস্থা", "Status"), cell: (r) => statusPill(r.status) },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (r) => (
                <Button size="sm" onClick={() => setSel(r)}>
                  {tr("দেখুন", "Review")}
                </Button>
              ),
            },
          ]}
        />
      </QueryState>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-lg">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>{sel.targetLabel}</DialogTitle>
                <DialogDescription>
                  {type(sel.targetType)} · {reason(sel.reason)} · {sel.reporter}
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed">{sel.details}</p>
              <div className="flex flex-wrap gap-2">
                {sel.targetType === "post" && (
                  <Button
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => done("resolved", true)}
                  >
                    {tr("পোস্ট লুকিয়ে নিষ্পত্তি", "Hide post & resolve")}
                  </Button>
                )}
                <Button onClick={() => done("resolved")}>{tr("নিষ্পত্তি", "Resolve")}</Button>
                <Button variant="outline" onClick={() => done("investigating")}>
                  {tr("তদন্তে রাখুন", "Investigate")}
                </Button>
                <Button variant="ghost" onClick={() => done("dismissed")}>
                  {tr("খারিজ", "Dismiss")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
