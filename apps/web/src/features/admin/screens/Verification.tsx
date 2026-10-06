import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { Button } from "@/shared/components/ui";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminVerifications, useDecideVerification } from "../data/hooks";
import { AdminPage, FilterTabs, Panel } from "../kit";

type F = "pending" | "done";

/**
 * Accounts verify themselves by email code + address + phone, so no ID documents are reviewed.
 * This queue only holds accounts our automatic checks flagged as suspicious.
 */
export function Verification() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminVerifications();
  const decide = useDecideVerification();
  const [f, setF] = useState<F>("pending");
  const rows = data.filter((v) =>
    f === "pending" ? v.status === "pending" : v.status !== "pending",
  );

  return (
    <AdminPage
      title={tr("সন্দেহজনক অ্যাকাউন্ট যাচাই", "Flagged account review")}
      desc={tr(
        "স্বয়ংক্রিয় যাচাইয়ে ধরা পড়া অ্যাকাউন্ট — NID লাগে না, শুধু আপনার সিদ্ধান্ত",
        "Accounts our checks flagged — no ID needed, just your call",
      )}
    >
      <Helmet>
        <title>{tr("যাচাই", "Verification")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<F>
        value={f}
        onChange={setF}
        options={[
          {
            value: "pending",
            label: tr("বাকি", "Pending"),
            count: data.filter((v) => v.status === "pending").length,
          },
          {
            value: "done",
            label: tr("সম্পন্ন", "Done"),
            count: data.filter((v) => v.status !== "pending").length,
          },
        ]}
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {rows.length === 0 ? (
          <p className="rounded-2xl border bg-card py-16 text-center text-muted-foreground">
            🎉 {tr("কিছু বাকি নেই", "Nothing pending")}
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((v) => (
              <Panel key={v.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{v.user}</p>
                    <p className="truncate text-sm text-muted-foreground">{v.email}</p>
                    <p className="text-sm text-muted-foreground">📍 {v.address}</p>
                  </div>
                  {v.status === "approved" ? (
                    <Pill tone="success">{tr("অনুমোদিত", "Approved")}</Pill>
                  ) : v.status === "rejected" ? (
                    <Pill tone="danger">{tr("প্রত্যাখ্যাত", "Rejected")}</Pill>
                  ) : (
                    <Pill tone="warning">{v.created}</Pill>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {v.flags.map((fl) => (
                    <li
                      key={fl}
                      className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {fl}
                    </li>
                  ))}
                </ul>
                {v.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => decide.mutate({ id: v.id, status: "approved" })}
                    >
                      {tr("অনুমোদন", "Approve")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive"
                      onClick={() => decide.mutate({ id: v.id, status: "rejected" })}
                    >
                      {tr("প্রত্যাখ্যান", "Reject")}
                    </Button>
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )}
      </QueryState>
    </AdminPage>
  );
}
