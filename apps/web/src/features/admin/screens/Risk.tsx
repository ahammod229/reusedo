import { QueryState } from "@/features/data/QueryState";
import { useNum, useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { Field, SelectField } from "@/pages/auth/components/Field";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from "@/shared/components/ui";
import { CheckCircle2, CircleAlert, Loader2, MapPin, Phone, Search, XCircle } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  useAddBlock,
  useBlocklist,
  useDecideRisk,
  useLookupPhone,
  useRemoveBlock,
  useRiskCases,
} from "../data/hooks";
import type {
  AdminRiskCase,
  BlockEntry,
  CourierHistory,
  RiskLevel,
  RiskSignal,
} from "../data/types";
import { AdminPage, ConfirmDialog, DataTable, FilterTabs, Panel, ReasonDialog } from "../kit";
import { riskLevel, riskScore } from "../risk";

type View = "queue" | "phone" | "blocklist";
type F = AdminRiskCase["status"] | "all";

export function RiskLevelPill({ level }: { level: RiskLevel }) {
  const tr = useTr();
  return level === "high" ? (
    <Pill tone="danger">{tr("উচ্চ ঝুঁকি", "High risk")}</Pill>
  ) : level === "medium" ? (
    <Pill tone="warning">{tr("মাঝারি ঝুঁকি", "Medium risk")}</Pill>
  ) : (
    <Pill tone="success">{tr("কম ঝুঁকি", "Low risk")}</Pill>
  );
}

export function RiskStatusPill({ s }: { s: AdminRiskCase["status"] }) {
  const tr = useTr();
  const m = {
    open: ["warning", tr("চেক বাকি", "To check")],
    approved: ["success", tr("অনুমোদিত", "Approved")],
    held: ["warning", tr("হোল্ড — আগাম পেমেন্ট", "Held — pay ahead")],
    rejected: ["danger", tr("বাতিল", "Rejected")],
  } as const;
  return <Pill tone={m[s][0]}>{m[s][1]}</Pill>;
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const num = useNum();
  const level = riskLevel(score);
  const color =
    level === "high"
      ? "var(--destructive)"
      : level === "medium"
        ? "var(--warning)"
        : "var(--success)";
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, var(--muted) 0)`,
      }}
      role="img"
      aria-label={`Risk score ${score}`}
    >
      <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-card text-sm font-extrabold">
        {num(score)}
      </div>
    </div>
  );
}

export function Risk() {
  const tr = useTr();
  const [view, setView] = useState<View>("queue");
  return (
    <AdminPage
      title={tr("ফ্রড ও ঠিকানা চেক", "Fraud & address check")}
      desc={tr(
        "প্রতিটি রিকোয়েস্টের ঝুঁকি স্কোর, ঠিকানা যাচাই ও কুরিয়ার ইতিহাস — কুরিয়ার কনফার্মের আগে দেখুন",
        "Risk score, address check and courier history for every request — check before confirming courier",
      )}
    >
      <Helmet>
        <title>{tr("ফ্রড চেক", "Fraud check")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<View>
        value={view}
        onChange={setView}
        options={[
          { value: "queue", label: tr("রিকোয়েস্ট চেক", "Request checks") },
          { value: "phone", label: tr("নম্বর যাচাই", "Phone lookup") },
          { value: "blocklist", label: tr("ব্লকলিস্ট", "Blocklist") },
        ]}
      />
      {view === "queue" ? <Queue /> : view === "phone" ? <PhoneLookup /> : <Blocklist />}
    </AdminPage>
  );
}

function Queue() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useRiskCases();
  const [f, setF] = useState<F>("open");
  const [selId, setSelId] = useState<string | null>(null);
  const sel = data.find((c) => c.id === selId) ?? null;
  const rows = data
    .filter((c) => f === "all" || c.status === f)
    .sort((a, b) => riskScore(b.signals) - riskScore(a.signals));
  const n = (s: AdminRiskCase["status"]) => data.filter((c) => c.status === s).length;

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
      <FilterTabs<F>
        value={f}
        onChange={setF}
        options={[
          { value: "open", label: tr("চেক বাকি", "To check"), count: n("open") },
          { value: "held", label: tr("হোল্ড", "Held"), count: n("held") },
          { value: "approved", label: tr("অনুমোদিত", "Approved"), count: n("approved") },
          { value: "rejected", label: tr("বাতিল", "Rejected"), count: n("rejected") },
          { value: "all", label: tr("সব", "All"), count: data.length },
        ]}
      />
      {rows.length === 0 ? (
        <p className="rounded-2xl border bg-card py-16 text-center text-muted-foreground">
          🎉 {tr("কিছু বাকি নেই", "Nothing to check")}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((c) => {
            const score = riskScore(c.signals);
            const bad = c.signals.filter((s) => s.result !== "pass");
            return (
              <li
                key={c.id}
                className="flex flex-col rounded-2xl border bg-card p-4"
                data-risk={c.id}
              >
                <div className="flex items-start gap-3">
                  <ScoreRing score={score} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{c.user}</p>
                    <p className="text-sm text-muted-foreground">{c.item}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <RiskLevelPill level={riskLevel(score)} />
                      <RiskStatusPill s={c.status} />
                    </div>
                  </div>
                </div>
                {bad.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs">
                    {bad.slice(0, 3).map((s) => (
                      <li
                        key={s.key}
                        className={cn(
                          "flex items-start gap-1.5 font-medium",
                          s.result === "fail" ? "text-destructive" : "text-warning",
                        )}
                      >
                        <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                        {s.label}: {s.detail}
                      </li>
                    ))}
                    {bad.length > 3 && (
                      <li className="text-muted-foreground">
                        +{bad.length - 3} {tr("আরও", "more")}
                      </li>
                    )}
                  </ul>
                )}
                <Button
                  className="mt-auto w-full"
                  style={{ marginTop: "0.75rem" }}
                  variant={c.status === "open" ? "default" : "outline"}
                  onClick={() => setSelId(c.id)}
                >
                  {c.status === "open" ? tr("চেক করুন", "Review") : tr("বিস্তারিত", "Details")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {sel && <CaseDialog c={sel} onClose={() => setSelId(null)} />}
    </QueryState>
  );
}

const ICON = {
  pass: <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />,
  warn: <CircleAlert className="h-4 w-4 shrink-0 text-warning" />,
  fail: <XCircle className="h-4 w-4 shrink-0 text-destructive" />,
};

function SignalList({ signals }: { signals: RiskSignal[] }) {
  return (
    <ul className="divide-y rounded-xl border text-sm">
      {signals.map((s) => (
        <li key={s.key} className="flex items-start gap-2 px-3 py-2">
          <span className="mt-0.5">{ICON[s.result]}</span>
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{s.label}</span>
            <span className="block break-words text-xs text-muted-foreground">{s.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function HistoryBar({ h }: { h: CourierHistory | null }) {
  const tr = useTr();
  const num = useNum();
  if (!h || h.total === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {tr("কোনো কুরিয়ার রেকর্ড নেই", "No courier record")}
      </p>
    );
  const pct = Math.round((h.delivered / h.total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>
          {tr("নিয়েছেন", "Received")} <b>{num(h.delivered)}</b> · {tr("ফেরত", "Returned")}{" "}
          <b>{num(h.returned)}</b>
        </span>
        <b className={pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive"}>
          {num(pct)}%
        </b>
      </div>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-destructive/25">
        <div className="bg-success" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {tr("সূত্র", "Source")}: {h.source}
      </p>
    </div>
  );
}

function CaseDialog({ c, onClose }: { c: AdminRiskCase; onClose: () => void }) {
  const tr = useTr();
  const decide = useDecideRisk();
  const [hold, setHold] = useState(false);
  const [reject, setReject] = useState(false);
  const [block, setBlock] = useState(true);
  const score = riskScore(c.signals);
  const level = riskLevel(score);
  const advice = {
    low: tr("সব ঠিক দেখাচ্ছে — অনুমোদন দিতে পারেন।", "Looks fine — safe to approve."),
    medium: tr(
      "কিছু সন্দেহ আছে। চ্যাট দেখে নিন বা আগাম পেমেন্ট চেয়ে হোল্ড করুন।",
      "Some doubts. Check the chat, or hold and ask for advance payment.",
    ),
    high: tr(
      "উচ্চ ঝুঁকি — বাতিল করা বা আগাম পেমেন্ট ছাড়া কুরিয়ার না পাঠানো ভালো।",
      "High risk — reject, or don't ship without advance payment.",
    ),
  }[level];

  return (
    <>
      <Dialog open={!hold && !reject} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <ScoreRing score={score} size={60} />
              <div className="min-w-0">
                <DialogTitle>{c.user}</DialogTitle>
                <DialogDescription>
                  {c.item} · {c.created}
                </DialogDescription>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <RiskLevelPill level={level} />
                  <RiskStatusPill s={c.status} />
                </div>
              </div>
            </div>
          </DialogHeader>

          <p
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              level === "high"
                ? "bg-destructive/10 text-destructive"
                : level === "medium"
                  ? "bg-warning-soft text-warning"
                  : "bg-offer-soft text-success",
            )}
          >
            {advice}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {tr("ডেলিভারি ঠিকানা", "Delivery address")}
              </p>
              <p>{c.address.line || "—"}</p>
              <p className="text-muted-foreground">
                {c.address.thana || "—"}, {c.address.district || "—"}
              </p>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {tr("যোগাযোগ", "Contact")}
              </p>
              <p className="font-mono">{c.phone}</p>
              <p className="truncate text-muted-foreground">{c.email}</p>
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
              {tr("কুরিয়ার ইতিহাস", "Courier history")}
            </p>
            <HistoryBar h={c.history} />
          </div>

          <SignalList signals={c.signals} />
          {c.note && (
            <p className="text-sm text-muted-foreground">
              {tr("নোট", "Note")}: {c.note}
            </p>
          )}

          {c.status === "open" || c.status === "held" ? (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setReject(true)}
              >
                {tr("বাতিল", "Reject")}
              </Button>
              <Button
                variant="outline"
                disabled={c.status === "held"}
                onClick={() => setHold(true)}
              >
                {tr("হোল্ড", "Hold")}
              </Button>
              <Button
                onClick={() => {
                  decide.mutate({ id: c.id, status: "approved" });
                  onClose();
                }}
              >
                {tr("অনুমোদন", "Approve")}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                decide.mutate({ id: c.id, status: "open" });
                onClose();
              }}
            >
              {tr("আবার খুলুন", "Reopen")}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={hold}
        onClose={() => setHold(false)}
        onConfirm={(note) => {
          decide.mutate({ id: c.id, status: "held", note });
          onClose();
        }}
        title={tr("হোল্ড করে আগাম পেমেন্ট চাইবেন?", "Hold and ask for advance payment?")}
        desc={tr(
          "গ্রহীতাকে ইমেইলে bKash/Nagad-এ আগাম চার্জ দিতে বলা হবে। পেমেন্ট গৃহীত হলে আবার অনুমোদন দিন।",
          "The receiver is emailed to pay ahead by bKash/Nagad. Approve once the payment is accepted.",
        )}
        confirmLabel={tr("হোল্ড", "Hold")}
        required={false}
      />
      <ReasonDialog
        open={reject}
        onClose={() => setReject(false)}
        onConfirm={(note) => {
          decide.mutate({ id: c.id, status: "rejected", note, blockPhone: block });
          onClose();
        }}
        title={tr("রিকোয়েস্ট বাতিল করবেন?", "Reject this request?")}
        desc={tr("দাতা ও গ্রহীতাকে জানানো হবে।", "Both people are notified.")}
        confirmLabel={tr("বাতিল করুন", "Reject")}
        danger
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block}
            onChange={(e) => setBlock(e.target.checked)}
            className="h-4 w-4 accent-[var(--destructive)]"
          />
          {tr(`${c.phone} নম্বরটি ব্লকলিস্টে যোগ করুন`, `Add ${c.phone} to the blocklist`)}
        </label>
      </ReasonDialog>
    </>
  );
}

function PhoneLookup() {
  const tr = useTr();
  const num = useNum();
  const lookup = useLookupPhone();
  const [phone, setPhone] = useState("");
  const r = lookup.data;
  return (
    <div className="max-w-2xl space-y-4">
      <Panel>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (phone.trim()) lookup.mutate(phone.trim());
          }}
        >
          <div className="flex-1">
            <Field
              label={tr("মোবাইল নম্বর", "Mobile number")}
              inputMode="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" disabled={!phone.trim() || lookup.isPending}>
            {lookup.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-1.5 h-4 w-4" />
            )}
            {tr("যাচাই", "Check")}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {tr(
            "আমাদের রেকর্ড ও কুরিয়ার ইতিহাস মিলিয়ে দেখায়। কুরিয়ার ইতিহাস পেতে Steadfast ইন্টিগ্রেশন চালু থাকতে হবে।",
            "Combines our records with courier history (needs the Steadfast integration).",
          )}
        </p>
      </Panel>

      {r && (
        <Panel title={r.phone}>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-1.5">
              {r.valid ? (
                <Pill tone="success">{tr("সঠিক নম্বর", "Valid number")}</Pill>
              ) : (
                <Pill tone="danger">{tr("ভুল নম্বর", "Invalid number")}</Pill>
              )}
              {r.operator && <Pill>{r.operator}</Pill>}
              {r.blocked && <Pill tone="danger">{tr("ব্লকলিস্টে আছে", "Blocked")}</Pill>}
            </div>
            <HistoryBar h={r.history} />
            <p>
              {tr("এই নম্বরের অ্যাকাউন্ট", "Accounts with this number")}:{" "}
              <b>{r.accounts.length ? r.accounts.join(", ") : tr("নেই", "none")}</b>
              {r.accounts.length > 1 && (
                <span className="ml-1 font-semibold text-warning">
                  ({num(r.accounts.length)} {tr("টি — সন্দেহজনক", "— suspicious")})
                </span>
              )}
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}

const TYPES: { value: BlockEntry["type"]; bn: string; en: string }[] = [
  { value: "phone", bn: "ফোন নম্বর", en: "Phone" },
  { value: "email", bn: "ইমেইল / ডোমেইন", en: "Email / domain" },
  { value: "address", bn: "ঠিকানা", en: "Address" },
  { value: "device", bn: "ডিভাইস আইডি", en: "Device ID" },
];

function Blocklist() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useBlocklist();
  const add = useAddBlock();
  const remove = useRemoveBlock();
  const [type, setType] = useState<BlockEntry["type"]>("phone");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [del, setDel] = useState<BlockEntry | null>(null);
  const dup = data.some(
    (b) => b.type === type && b.value.toLowerCase() === value.trim().toLowerCase(),
  );
  const ok = value.trim().length >= 3 && reason.trim().length >= 3 && !dup;
  const typeLabel = (t: BlockEntry["type"]) => {
    const x = TYPES.find((y) => y.value === t);
    return x ? tr(x.bn, x.en) : t;
  };

  return (
    <div className="space-y-4">
      <Panel title={tr("নতুন ব্লক", "Add block")}>
        <form
          className="grid gap-3 md:grid-cols-[12rem_1fr_1fr_auto] md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({ type, value: value.trim(), reason: reason.trim() });
            setValue("");
            setReason("");
          }}
        >
          <SelectField
            label={tr("ধরন", "Type")}
            value={type}
            onChange={(v) => setType(v as BlockEntry["type"])}
            placeholder={tr("বাছাই করুন", "Choose")}
            options={TYPES.map((t) => ({ value: t.value, label: tr(t.bn, t.en) }))}
          />
          <Field
            label={tr("মান", "Value")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={dup ? tr("আগেই ব্লক করা আছে", "Already blocked") : undefined}
          />
          <Field
            label={tr("কারণ", "Reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" size="lg" disabled={!ok}>
            {tr("ব্লক করুন", "Block")}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {tr(
            "ব্লক করা নম্বর/ইমেইল দিয়ে নতুন অ্যাকাউন্ট বা রিকোয়েস্ট করা যাবে না।",
            "Blocked phones/emails can't sign up or send requests.",
          )}
        </p>
      </Panel>

      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={data}
          rowKey={(b) => b.id}
          empty={tr("ব্লকলিস্ট খালি", "Blocklist is empty")}
          cols={[
            {
              key: "value",
              header: tr("মান", "Value"),
              primary: true,
              cell: (b) => <span className="font-mono">{b.value}</span>,
            },
            {
              key: "type",
              header: tr("ধরন", "Type"),
              cell: (b) => <Pill>{typeLabel(b.type)}</Pill>,
            },
            { key: "reason", header: tr("কারণ", "Reason"), cell: (b) => b.reason },
            { key: "added", header: tr("কবে", "Added"), cell: (b) => b.added },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (b) => (
                <Button size="sm" variant="outline" onClick={() => setDel(b)}>
                  {tr("সরান", "Remove")}
                </Button>
              ),
            },
          ]}
        />
      </QueryState>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del.id)}
        title={tr("ব্লক তুলে নেবেন?", "Remove this block?")}
        desc={del?.value}
        confirmLabel={tr("সরান", "Remove")}
      />
    </div>
  );
}
