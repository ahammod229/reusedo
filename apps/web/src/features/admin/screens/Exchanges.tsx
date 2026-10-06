import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { Button } from "@/shared/components/ui";
import { Truck, PackageCheck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminExchanges, useCancelExchange } from "../data/hooks";
import type { AdminExchange } from "../data/types";
import { AdminPage, ConfirmDialog, DataTable, FilterTabs } from "../kit";

type F = "all" | "active" | "completed" | "cancelled";
const ACTIVE: AdminExchange["status"][] = ["requested", "accepted", "scheduled"];

export function Exchanges() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminExchanges();
  const cancel = useCancelExchange();
  const [f, setF] = useState<F>("all");
  const [target, setTarget] = useState<AdminExchange | null>(null);
  const rows = data.filter((e) =>
    f === "all" ? true : f === "active" ? ACTIVE.includes(e.status) : e.status === f,
  );
  const label: Record<AdminExchange["status"], string> = {
    requested: tr("রিকোয়েস্ট", "Requested"),
    accepted: tr("গৃহীত", "Accepted"),
    scheduled: tr("সময় ঠিক", "Scheduled"),
    completed: tr("সম্পন্ন", "Completed"),
    cancelled: tr("বাতিল", "Cancelled"),
  };
  const n = (fn: (e: AdminExchange) => boolean) => data.filter(fn).length;

  return (
    <AdminPage
      title={tr("লেনদেন", "Exchanges")}
      desc={tr(
        "দেওয়া-নেওয়ার তদারকি। বিরোধ হলে বাতিল করতে পারেন।",
        "Monitor hand-overs. Cancel if there's a dispute.",
      )}
    >
      <Helmet>
        <title>{tr("লেনদেন", "Exchanges")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<F>
        value={f}
        onChange={setF}
        options={[
          { value: "all", label: tr("সব", "All"), count: data.length },
          {
            value: "active",
            label: tr("চলমান", "Active"),
            count: n((e) => ACTIVE.includes(e.status)),
          },
          {
            value: "completed",
            label: tr("সম্পন্ন", "Completed"),
            count: n((e) => e.status === "completed"),
          },
          {
            value: "cancelled",
            label: tr("বাতিল", "Cancelled"),
            count: n((e) => e.status === "cancelled"),
          },
        ]}
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={rows}
          rowKey={(e) => e.id}
          cols={[
            {
              key: "item",
              header: tr("জিনিস", "Item"),
              primary: true,
              cell: (e) => <span className="font-semibold">{e.item}</span>,
            },
            { key: "giver", header: tr("দাতা", "Giver"), cell: (e) => e.giver },
            { key: "receiver", header: tr("গ্রহীতা", "Receiver"), cell: (e) => e.receiver },
            {
              key: "via",
              header: tr("মাধ্যম", "Via"),
              cell: (e) =>
                e.via === "courier" ? (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    {tr("কুরিয়ার", "Courier")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <PackageCheck className="h-4 w-4" />
                    {tr("সরাসরি", "Pickup")}
                  </span>
                ),
            },
            { key: "updated", header: tr("সর্বশেষ", "Updated"), cell: (e) => e.updated },
            {
              key: "status",
              header: tr("অবস্থা", "Status"),
              cell: (e) => (
                <Pill
                  tone={
                    e.status === "cancelled"
                      ? "danger"
                      : e.status === "completed"
                        ? "success"
                        : "warning"
                  }
                >
                  {label[e.status]}
                </Pill>
              ),
            },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (e) =>
                ACTIVE.includes(e.status) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setTarget(e)}
                  >
                    {tr("বাতিল", "Cancel")}
                  </Button>
                ) : null,
            },
          ]}
        />
      </QueryState>
      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        danger
        title={tr("লেনদেন বাতিল করবেন?", "Cancel this exchange?")}
        desc={tr("দুই পক্ষকেই জানানো হবে।", "Both parties will be notified.")}
        confirmLabel={tr("বাতিল করুন", "Cancel exchange")}
        onConfirm={() => target && cancel.mutate(target.id)}
      />
    </AdminPage>
  );
}
