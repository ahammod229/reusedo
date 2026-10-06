import { QueryState } from "@/features/data/QueryState";
import { useCourierRequests, useDecideCourier } from "@/features/data/hooks";
import { useNum, useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { categoryOf } from "@/features/feed/types";
import type { CourierRequestItem } from "@/features/feed/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { AdminPage, FilterTabs } from "../../kit";

type F = "pending" | "confirmed" | "rejected" | "all";

export function CourierQueue() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useCourierRequests();
  const decide = useDecideCourier();
  const [f, setF] = useState<F>("pending");
  const [sel, setSel] = useState<CourierRequestItem | null>(null);
  const rows = data.filter((r) => f === "all" || r.status === f);
  const n = (s: CourierRequestItem["status"]) => data.filter((r) => r.status === s).length;

  // Real flow (backend): confirm → create the Steadfast parcel, store tracking code, email both users.
  const act = (decision: "confirmed" | "rejected") => {
    if (sel) decide.mutate({ id: sel.id, decision });
    setSel(null);
  };

  return (
    <AdminPage
      title={tr("কুরিয়ার রিকোয়েস্ট", "Courier requests")}
      desc={tr(
        "দুজন রাজি হলে এখানে আসে। ঠিকানা দেখে কনফার্ম করুন — তখন Steadfast পার্সেল তৈরি হবে।",
        "Appears once both agree. Confirm after checking addresses — Steadfast parcel is created then.",
      )}
    >
      <Helmet>
        <title>{tr("কুরিয়ার", "Courier")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<F>
        value={f}
        onChange={setF}
        options={[
          { value: "pending", label: tr("অপেক্ষমাণ", "Pending"), count: n("pending") },
          { value: "confirmed", label: tr("অনুমোদিত", "Confirmed"), count: n("confirmed") },
          { value: "rejected", label: tr("প্রত্যাখ্যাত", "Rejected"), count: n("rejected") },
          { value: "all", label: tr("সব", "All"), count: data.length },
        ]}
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {rows.length === 0 ? (
          <p className="rounded-2xl border bg-card py-16 text-center text-muted-foreground">
            🎉 {tr("কিছু নেই", "Nothing here")}
          </p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{categoryOf(r.category).emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{r.item}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                      {r.giver.address} <ArrowRight className="h-3.5 w-3.5" /> {r.receiver.address}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {num(r.weightKg)} {tr("কেজি", "kg")} · COD ৳{num(r.charge)} · {r.createdAt}
                    </p>
                  </div>
                  <Pill
                    tone={
                      r.status === "pending"
                        ? "warning"
                        : r.status === "confirmed"
                          ? "success"
                          : "danger"
                    }
                  >
                    {r.status === "pending"
                      ? tr("অপেক্ষমাণ", "Pending")
                      : r.status === "confirmed"
                        ? "courier_ready"
                        : tr("প্রত্যাখ্যাত", "Rejected")}
                  </Pill>
                </div>
                {r.tracking && (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                    {tr("ট্র্যাকিং", "Tracking")}: <b>{r.tracking}</b>
                  </p>
                )}
                {r.status === "pending" && (
                  <Button className="mt-3 w-full" onClick={() => setSel(r)}>
                    {tr("যাচাই করুন", "Review")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>{sel.item}</DialogTitle>
                <DialogDescription>
                  {tr("ওজন", "Weight")} {num(sel.weightKg)} {tr("কেজি", "kg")} · COD ৳
                  {num(sel.charge)}
                </DialogDescription>
              </DialogHeader>
              <Party title={tr("পিকআপ (দাতা)", "Pickup (giver)")} p={sel.giver} />
              <Party title={tr("ডেলিভারি (গ্রহীতা)", "Delivery (receiver)")} p={sel.receiver} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive"
                  onClick={() => act("rejected")}
                >
                  {tr("বাতিল", "Reject")}
                </Button>
                <Button className="flex-1" onClick={() => act("confirmed")}>
                  {tr("কনফার্ম", "Confirm")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function Party({
  title,
  p,
}: { title: string; p: { name: string; phone: string; address: string } }) {
  return (
    <div className="rounded-xl border p-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 font-semibold">
        {p.name} · {p.phone}
      </p>
      <p>{p.address}</p>
    </div>
  );
}
