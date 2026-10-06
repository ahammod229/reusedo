import { QueryState } from "@/features/data/QueryState";
import { useCourierRequests, useDecideCourier } from "@/features/data/hooks";
import { METHOD_LABEL } from "@/features/data/platformStore";
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
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { useAdminPayments, useRiskCases } from "../../data/hooks";
import type { AdminRiskCase, Payment } from "../../data/types";
import { AdminPage, FilterTabs } from "../../kit";
import { riskLevel, riskScore } from "../../risk";
import { PaymentStatusPill } from "../../screens/Payments";
import { RiskLevelPill, RiskStatusPill } from "../../screens/Risk";

type F = "pending" | "confirmed" | "rejected" | "all";

export function CourierQueue() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useCourierRequests();
  const decide = useDecideCourier();
  const { data: risks = [] } = useRiskCases();
  const { data: payments = [] } = useAdminPayments();
  const riskOf = (id: string) => risks.find((k) => k.courierId === id);
  // A request can have several attempts (e.g. a rejected TrxID, then a new one); a settled one wins.
  const payOf = (id: string) => {
    const mine = payments.filter((p) => p.courierId === id);
    return mine.find((p) => ["verified", "cod_due", "cod_collected"].includes(p.status)) ?? mine[0];
  };
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
                <Checks risk={riskOf(r.id)} pay={payOf(r.id)} />
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
              <Blockers risk={riskOf(sel.id)} pay={payOf(sel.id)} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive"
                  onClick={() => act("rejected")}
                >
                  {tr("বাতিল", "Reject")}
                </Button>
                <Button
                  className="flex-1"
                  disabled={blockers(riskOf(sel.id), payOf(sel.id)).length > 0}
                  onClick={() => act("confirmed")}
                >
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

/** Why a courier request can't be confirmed yet. Mirrors the server-side rule. */
function blockers(risk?: AdminRiskCase, pay?: Payment) {
  const out: { bn: string; en: string; href: string }[] = [];
  if (risk && risk.status !== "approved")
    out.push({
      bn: risk.status === "rejected" ? "ফ্রড চেকে বাতিল হয়েছে" : "ফ্রড ও ঠিকানা চেক এখনো অনুমোদন হয়নি",
      en:
        risk.status === "rejected"
          ? "Rejected in fraud check"
          : "Fraud & address check not approved yet",
      href: "/admin/risk",
    });
  if (pay && (pay.status === "pending" || pay.status === "rejected"))
    out.push({
      bn: pay.status === "pending" ? "আগাম পেমেন্ট যাচাই বাকি" : "পেমেন্ট প্রত্যাখ্যাত",
      en: pay.status === "pending" ? "Advance payment not verified" : "Payment rejected",
      href: "/admin/payments",
    });
  return out;
}

function Checks({ risk, pay }: { risk?: AdminRiskCase; pay?: Payment }) {
  const tr = useTr();
  const num = useNum();
  if (!risk && !pay) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3 text-xs">
      {risk && (
        <>
          <RiskLevelPill level={riskLevel(riskScore(risk.signals))} />
          <RiskStatusPill s={risk.status} />
        </>
      )}
      {pay && (
        <>
          <span className="ml-1 text-muted-foreground">
            {METHOD_LABEL[pay.method]} ৳{num(pay.amount)}
          </span>
          <PaymentStatusPill s={pay.status} />
        </>
      )}
      {!risk && (
        <span className="text-muted-foreground">{tr("ফ্রড চেক নেই", "No fraud check")}</span>
      )}
    </div>
  );
}

function Blockers({ risk, pay }: { risk?: AdminRiskCase; pay?: Payment }) {
  const tr = useTr();
  const list = blockers(risk, pay);
  if (!list.length)
    return (
      <p className="rounded-xl bg-offer-soft px-3 py-2 text-sm font-medium text-success">
        ✓ {tr("ফ্রড চেক ও পেমেন্ট ঠিক আছে — কনফার্ম করা যাবে", "Fraud check and payment are clear")}
      </p>
    );
  return (
    <ul className="space-y-1.5 rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm">
      {list.map((b) => (
        <li key={b.href} className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-medium">{tr(b.bn, b.en)}</span>
          <Link to={b.href} className="shrink-0 font-bold underline">
            {tr("দেখুন", "Open")}
          </Link>
        </li>
      ))}
    </ul>
  );
}
