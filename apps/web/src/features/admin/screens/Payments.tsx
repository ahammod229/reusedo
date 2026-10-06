import { QueryState } from "@/features/data/QueryState";
import { METHOD_LABEL } from "@/features/data/platformStore";
import { useNum, useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { isBdMobile } from "@/features/geo/bd";
import { Field, SelectField } from "@/pages/auth/components/Field";
import { Button } from "@/shared/components/ui";
import { AlertTriangle, Banknote, Clock, RotateCcw, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  useAdminPayments,
  useDecidePayment,
  usePaymentSettings,
  useSavePaymentSettings,
} from "../data/hooks";
import type { Payment, PaymentSettings } from "../data/types";
import {
  AdminPage,
  ConfirmDialog,
  DataTable,
  FilterTabs,
  Panel,
  ReasonDialog,
  SearchBox,
  StatCard,
  ToggleRow,
} from "../kit";

type View = "payments" | "settings";
type F = "pending" | "cod_due" | "verified" | "closed" | "all";

export function PaymentStatusPill({ s }: { s: Payment["status"] }) {
  const tr = useTr();
  const m: Record<Payment["status"], [Parameters<typeof Pill>[0]["tone"], string]> = {
    pending: ["warning", tr("যাচাই বাকি", "To verify")],
    verified: ["success", tr("গৃহীত", "Accepted")],
    rejected: ["danger", tr("প্রত্যাখ্যাত", "Rejected")],
    refunded: ["muted", tr("ফেরত দেওয়া", "Refunded")],
    cod_due: ["muted", tr("ডেলিভারিতে নেবে", "COD due")],
    cod_collected: ["success", tr("COD সংগৃহীত", "COD collected")],
  };
  return <Pill tone={m[s][0]}>{m[s][1]}</Pill>;
}

export function Payments() {
  const tr = useTr();
  const [view, setView] = useState<View>("payments");
  return (
    <AdminPage
      title={tr("পেমেন্ট", "Payments")}
      desc={tr(
        "গ্রহীতা কুরিয়ার চার্জ দেন — ডেলিভারিতে (COD) বা আগাম bKash/Nagad-এ। আগাম পেমেন্ট যাচাই করে গ্রহণ করুন।",
        "Receivers pay the courier charge — on delivery (COD) or in advance by bKash/Nagad. Verify advance payments here.",
      )}
    >
      <Helmet>
        <title>{tr("পেমেন্ট", "Payments")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<View>
        value={view}
        onChange={setView}
        options={[
          { value: "payments", label: tr("পেমেন্ট তালিকা", "Payments") },
          { value: "settings", label: tr("পদ্ধতি ও চার্জ", "Methods & charges") },
        ]}
      />
      {view === "payments" ? <PaymentList /> : <PaymentSettingsForm />}
    </AdminPage>
  );
}

function PaymentList() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useAdminPayments();
  const decide = useDecidePayment();
  const [f, setF] = useState<F>("pending");
  const [q, setQ] = useState("");
  const [accept, setAccept] = useState<Payment | null>(null);
  const [reject, setReject] = useState<Payment | null>(null);
  const [refund, setRefund] = useState<Payment | null>(null);

  const count = (fn: (p: Payment) => boolean) => data.filter(fn).length;
  const inF = (p: Payment) =>
    f === "all" ||
    (f === "closed"
      ? ["rejected", "refunded"].includes(p.status)
      : f === "verified"
        ? ["verified", "cod_collected"].includes(p.status)
        : p.status === f);
  const term = q.trim().toLowerCase();
  const rows = data
    .filter(inF)
    .filter(
      (p) =>
        !term || `${p.payer} ${p.item} ${p.phone} ${p.trxId ?? ""}`.toLowerCase().includes(term),
    );
  const sum = (fn: (p: Payment) => boolean) => data.filter(fn).reduce((n, p) => n + p.amount, 0);

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={tr("যাচাই বাকি", "To verify")}
          value={num(count((p) => p.status === "pending"))}
          icon={<Clock className="h-5 w-5" />}
          tone={count((p) => p.status === "pending") ? "warning" : "default"}
        />
        <StatCard
          label={tr("গৃহীত (আগাম)", "Accepted (advance)")}
          value={`৳${num(sum((p) => p.status === "verified"))}`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label={tr("COD বাকি", "COD due")}
          value={`৳${num(sum((p) => p.status === "cod_due"))}`}
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label={tr("ফেরত", "Refunded")}
          value={`৳${num(sum((p) => p.status === "refunded"))}`}
          icon={<RotateCcw className="h-5 w-5" />}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<F>
          value={f}
          onChange={setF}
          options={[
            {
              value: "pending",
              label: tr("যাচাই বাকি", "To verify"),
              count: count((p) => p.status === "pending"),
            },
            { value: "cod_due", label: "COD", count: count((p) => p.status === "cod_due") },
            {
              value: "verified",
              label: tr("গৃহীত", "Accepted"),
              count: count((p) => ["verified", "cod_collected"].includes(p.status)),
            },
            {
              value: "closed",
              label: tr("বাতিল/ফেরত", "Rejected/refunded"),
              count: count((p) => ["rejected", "refunded"].includes(p.status)),
            },
            { value: "all", label: tr("সব", "All"), count: data.length },
          ]}
        />
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder={tr("নাম, নম্বর বা TrxID", "Name, phone or TrxID")}
        />
      </div>

      <DataTable
        rows={rows}
        rowKey={(p) => p.id}
        empty={tr("এই তালিকায় কোনো পেমেন্ট নেই", "No payments here")}
        cols={[
          {
            key: "who",
            header: tr("গ্রহীতা ও জিনিস", "Receiver & item"),
            primary: true,
            cell: (p) => (
              <div className="min-w-0">
                <p className="font-semibold">{p.payer}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {p.item} · {p.created}
                </p>
                {p.flags.map((fl) => (
                  <p
                    key={fl}
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-destructive"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {fl}
                  </p>
                ))}
              </div>
            ),
          },
          {
            key: "method",
            header: tr("পদ্ধতি", "Method"),
            cell: (p) => (
              <div className="text-sm">
                <b>{METHOD_LABEL[p.method]}</b>
                {p.trxId && (
                  <span className="block font-mono text-xs text-muted-foreground">
                    {p.trxId} · {p.senderNumber}
                  </span>
                )}
              </div>
            ),
          },
          { key: "amount", header: tr("টাকা", "Amount"), cell: (p) => <b>৳{num(p.amount)}</b> },
          {
            key: "status",
            header: tr("অবস্থা", "Status"),
            cell: (p) => (
              <div>
                <PaymentStatusPill s={p.status} />
                {p.note && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{p.note}</p>}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            actions: true,
            cell: (p) => (
              <>
                {p.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setReject(p)}
                    >
                      {tr("প্রত্যাখ্যান", "Reject")}
                    </Button>
                    <Button size="sm" onClick={() => setAccept(p)}>
                      {tr("যাচাই করে গ্রহণ", "Verify & accept")}
                    </Button>
                  </>
                )}
                {p.status === "verified" && (
                  <Button size="sm" variant="outline" onClick={() => setRefund(p)}>
                    {tr("রিফান্ড", "Refund")}
                  </Button>
                )}
                {p.status === "cod_due" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide.mutate({ id: p.id, status: "cod_collected" })}
                  >
                    {tr("সংগৃহীত চিহ্নিত", "Mark collected")}
                  </Button>
                )}
              </>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={!!accept}
        onClose={() => setAccept(null)}
        onConfirm={() => accept && decide.mutate({ id: accept.id, status: "verified" })}
        title={tr("পেমেন্ট গ্রহণ করবেন?", "Accept this payment?")}
        desc={
          accept
            ? accept.flags.length
              ? tr(
                  `⚠ সতর্কতা: ${accept.flags.join("; ")}। ${METHOD_LABEL[accept.method]} মার্চেন্ট অ্যাপে TrxID ${accept.trxId} আর ৳${accept.amount} মিলিয়ে তবেই গ্রহণ করুন।`,
                  `⚠ Warning: ${accept.flags.join("; ")}. Match TrxID ${accept.trxId} and ৳${accept.amount} in the merchant app before accepting.`,
                )
              : tr(
                  `${METHOD_LABEL[accept.method]} মার্চেন্ট অ্যাপে TrxID ${accept.trxId} থেকে ৳${accept.amount} এসেছে কিনা মিলিয়ে নিন।`,
                  `Check the merchant app shows ৳${accept.amount} for TrxID ${accept.trxId}.`,
                )
            : undefined
        }
        confirmLabel={tr("মিলেছে — গ্রহণ করুন", "It matches — accept")}
        danger={!!accept?.flags.length}
      />
      <ReasonDialog
        open={!!reject}
        onClose={() => setReject(null)}
        onConfirm={(note) => reject && decide.mutate({ id: reject.id, status: "rejected", note })}
        title={tr("পেমেন্ট প্রত্যাখ্যান", "Reject payment")}
        desc={tr("কারণটা গ্রহীতাকে ইমেইলে জানানো হবে।", "The receiver is emailed this reason.")}
        confirmLabel={tr("প্রত্যাখ্যান", "Reject")}
        danger
      />
      <ReasonDialog
        open={!!refund}
        onClose={() => setRefund(null)}
        onConfirm={(note) => refund && decide.mutate({ id: refund.id, status: "refunded", note })}
        title={tr("টাকা ফেরত দেবেন?", "Refund this payment?")}
        desc={tr(
          "গেটওয়ে চালু থাকলে স্বয়ংক্রিয় রিফান্ড হবে; না হলে নিজে ফেরত পাঠিয়ে এখানে চিহ্নিত করুন।",
          "With a gateway the refund is automatic; otherwise send it yourself and mark it here.",
        )}
        confirmLabel={tr("রিফান্ড", "Refund")}
      />
    </QueryState>
  );
}

function PaymentSettingsForm() {
  const tr = useTr();
  const num = useNum();
  const { data, isLoading, error, refetch } = usePaymentSettings();
  const save = useSavePaymentSettings();
  const [s, setS] = useState<PaymentSettings | null>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => data && setS(data), [data]);

  const upd = (fn: (d: PaymentSettings) => void) => {
    setS((cur) => {
      if (!cur) return cur;
      const next = structuredClone(cur);
      fn(next);
      return next;
    });
    setOk(false);
  };
  const money = (v: string) => Math.min(2000, Math.max(0, Number.parseInt(v, 10) || 0));

  const errs = s
    ? {
        none: !Object.values(s.methods).some(Boolean),
        bkash: s.methods.bkash && !isBdMobile(s.bkashNumber),
        nagad: s.methods.nagad && !isBdMobile(s.nagadNumber),
      }
    : null;
  const valid = errs && !errs.none && !errs.bkash && !errs.nagad;

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
      {s && errs && (
        <form
          className="max-w-3xl space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(s);
            setOk(true);
          }}
        >
          <Panel title={tr("পেমেন্ট পদ্ধতি", "Payment methods")}>
            <div className="space-y-3">
              <ToggleRow
                title={tr("ক্যাশ অন ডেলিভারি (COD)", "Cash on delivery (COD)")}
                desc={tr(
                  "Steadfast ডেলিভারির সময় চার্জ নেয় — সবচেয়ে সহজ",
                  "Steadfast collects the charge on delivery — simplest",
                )}
                checked={s.methods.cod}
                onChange={(v) =>
                  upd((d) => {
                    d.methods.cod = v;
                  })
                }
              />
              <ToggleRow
                title="bKash"
                desc={tr("গ্রহীতা আগাম পাঠিয়ে TrxID দেন", "Receiver pays ahead and enters the TrxID")}
                checked={s.methods.bkash}
                onChange={(v) =>
                  upd((d) => {
                    d.methods.bkash = v;
                  })
                }
              >
                <Field
                  label={tr("bKash মার্চেন্ট/পার্সোনাল নম্বর", "bKash number")}
                  inputMode="tel"
                  value={s.bkashNumber}
                  error={
                    errs.bkash
                      ? tr("সঠিক ১১ ডিজিটের নম্বর দিন", "Enter a valid 11-digit number")
                      : undefined
                  }
                  onChange={(e) =>
                    upd((d) => {
                      d.bkashNumber = e.target.value;
                    })
                  }
                />
              </ToggleRow>
              <ToggleRow
                title="Nagad"
                desc={tr("গ্রহীতা আগাম পাঠিয়ে TrxID দেন", "Receiver pays ahead and enters the TrxID")}
                checked={s.methods.nagad}
                onChange={(v) =>
                  upd((d) => {
                    d.methods.nagad = v;
                  })
                }
              >
                <Field
                  label={tr("Nagad নম্বর", "Nagad number")}
                  inputMode="tel"
                  value={s.nagadNumber}
                  error={
                    errs.nagad
                      ? tr("সঠিক ১১ ডিজিটের নম্বর দিন", "Enter a valid 11-digit number")
                      : undefined
                  }
                  onChange={(e) =>
                    upd((d) => {
                      d.nagadNumber = e.target.value;
                    })
                  }
                />
              </ToggleRow>
              {errs.none && (
                <p className="text-sm font-medium text-destructive">
                  {tr("অন্তত একটি পদ্ধতি চালু রাখুন", "Keep at least one method on")}
                </p>
              )}
            </div>
          </Panel>

          <Panel title={tr("কুরিয়ার চার্জ (৳)", "Courier charges (৳)")}>
            <p className="mb-3 text-sm text-muted-foreground">
              {tr(
                "Steadfast-এর সাথে আপনার চুক্তির রেট বসান। গ্রহীতা রিকোয়েস্টের সময় এই হিসাব দেখেন।",
                "Use your Steadfast contract rates. Receivers see this when requesting.",
              )}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label={tr("ঢাকা সিটির ভেতরে", "Inside Dhaka")}
                type="number"
                inputMode="numeric"
                value={s.charges.insideDhaka}
                onChange={(e) =>
                  upd((d) => {
                    d.charges.insideDhaka = money(e.target.value);
                  })
                }
              />
              <Field
                label={tr("ঢাকার আশেপাশে", "Dhaka suburbs")}
                type="number"
                inputMode="numeric"
                value={s.charges.dhakaSuburb}
                onChange={(e) =>
                  upd((d) => {
                    d.charges.dhakaSuburb = money(e.target.value);
                  })
                }
              />
              <Field
                label={tr("ঢাকার বাইরে", "Outside Dhaka")}
                type="number"
                inputMode="numeric"
                value={s.charges.outsideDhaka}
                onChange={(e) =>
                  upd((d) => {
                    d.charges.outsideDhaka = money(e.target.value);
                  })
                }
              />
              <Field
                label={tr("মূল চার্জে কত কেজি", "Kg in base charge")}
                type="number"
                inputMode="numeric"
                value={s.baseWeightKg}
                onChange={(e) =>
                  upd((d) => {
                    d.baseWeightKg = Math.min(10, Math.max(0.5, Number(e.target.value) || 1));
                  })
                }
              />
              <Field
                label={tr("প্রতি বাড়তি কেজি", "Per extra kg")}
                type="number"
                inputMode="numeric"
                value={s.charges.perExtraKg}
                onChange={(e) =>
                  upd((d) => {
                    d.charges.perExtraKg = money(e.target.value);
                  })
                }
              />
            </div>
            <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">
              {tr("উদাহরণ: ৩ কেজি ঢাকার বাইরে", "Example: 3 kg outside Dhaka")} ={" "}
              <b>
                ৳
                {num(
                  s.charges.outsideDhaka +
                    Math.max(0, Math.ceil(3 - s.baseWeightKg)) * s.charges.perExtraKg,
                )}
              </b>
            </p>
          </Panel>

          <Panel title={tr("ঝুঁকিপূর্ণ রিকোয়েস্ট", "Risky requests")}>
            <SelectField
              label={tr("কখন আগাম পেমেন্ট বাধ্যতামূলক", "Require advance payment from")}
              value={s.advanceFrom}
              onChange={(v) =>
                upd((d) => {
                  d.advanceFrom = v as PaymentSettings["advanceFrom"];
                })
              }
              placeholder={tr("বাছাই করুন", "Choose")}
              options={[
                { value: "medium", label: tr("মাঝারি ও উচ্চ ঝুঁকিতে", "Medium and high risk") },
                {
                  value: "high",
                  label: tr("শুধু উচ্চ ঝুঁকিতে (প্রস্তাবিত)", "High risk only (recommended)"),
                },
                { value: "never", label: tr("কখনো না", "Never") },
              ]}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {tr(
                "ফেরত আসা পার্সেলের চার্জ বাঁচাতে: ঝুঁকিপূর্ণ হলে COD বন্ধ হয়ে আগাম bKash/Nagad চাওয়া হবে।",
                "Avoids paying for returned parcels: risky requests must pay ahead instead of COD.",
              )}
            </p>
          </Panel>

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={!valid}>
              {tr("সংরক্ষণ", "Save")}
            </Button>
            {ok && (
              <output className="text-sm font-medium text-success">
                {tr("সংরক্ষিত ✓", "Saved ✓")}
              </output>
            )}
          </div>
        </form>
      )}
    </QueryState>
  );
}
