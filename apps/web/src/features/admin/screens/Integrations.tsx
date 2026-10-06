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
  Switch,
  cn,
} from "@/shared/components/ui";
import { Check, Copy, ExternalLink, KeyRound, Loader2, Lock, PlugZap } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { useIntegrations, useSaveIntegration, useTestIntegration } from "../data/hooks";
import type { Integration, IntegrationStatus } from "../data/types";
import { AdminPage, ConfirmDialog, Panel } from "../kit";
import { integrationStatus } from "../risk";

const GROUPS: { id: Integration["group"]; bn: string; en: string }[] = [
  { id: "core", bn: "মূল সেবা — লঞ্চের আগে দরকার", en: "Core — needed before launch" },
  { id: "payment", bn: "পেমেন্ট গেটওয়ে", en: "Payment gateways" },
  { id: "optional", bn: "ঐচ্ছিক", en: "Optional" },
];

export function Integrations() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useIntegrations();
  const [edit, setEdit] = useState<Integration | null>(null);
  const core = data.filter((i) => i.group === "core");
  const ready = core.filter((i) => integrationStatus(i) === "connected").length;

  return (
    <AdminPage
      title={tr("API ও ইন্টিগ্রেশন", "APIs & integrations")}
      desc={tr(
        "Gemini, Steadfast, ইমেইল, পেমেন্টসহ সব বাইরের সেবা এক জায়গায়",
        "Gemini, Steadfast, email, payments and every other external service in one place",
      )}
    >
      <Helmet>
        <title>{tr("API ও ইন্টিগ্রেশন", "Integrations")} — ReuseDo Admin</title>
      </Helmet>

      <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          {tr(
            "কী শুধু সার্ভারে এনক্রিপ্ট করে রাখা হয়। সংরক্ষণের পর পুরো কী আর কখনো দেখা যায় না — শুধু শেষ ৪ অক্ষর। অডিট লগে কে কোন সেবা বদলেছে তা থাকে, কী নয়।",
            "Keys are stored encrypted on the server. After saving, only the last 4 characters are ever shown. The audit log records who changed which service — never the key.",
          )}
        </p>
      </div>

      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={3}>
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">{tr("লঞ্চ প্রস্তুতি", "Launch readiness")}</p>
            <p className="text-sm text-muted-foreground">
              {num(ready)}/{num(core.length)} {tr("মূল সেবা সংযুক্ত", "core services connected")}
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${core.length ? (ready / core.length) * 100 : 0}%` }}
            />
          </div>
        </Panel>

        {GROUPS.map((g) => {
          const items = data.filter((i) => i.group === g.id);
          if (!items.length) return null;
          return (
            <section key={g.id} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {tr(g.bn, g.en)}
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((i) => (
                  <IntegrationCard key={i.id} i={i} onEdit={() => setEdit(i)} />
                ))}
              </div>
            </section>
          );
        })}
      </QueryState>

      {edit && <EditDialog key={edit.id} i={edit} onClose={() => setEdit(null)} />}
    </AdminPage>
  );
}

export function StatusPill({ s }: { s: IntegrationStatus }) {
  const tr = useTr();
  const map: Record<IntegrationStatus, [Parameters<typeof Pill>[0]["tone"], string]> = {
    connected: ["success", tr("সংযুক্ত", "Connected")],
    untested: ["warning", tr("টেস্ট বাকি", "Not tested")],
    error: ["danger", tr("সমস্যা", "Error")],
    not_configured: ["muted", tr("কী দেওয়া হয়নি", "Not set up")],
    disabled: ["muted", tr("বন্ধ", "Off")],
  };
  return <Pill tone={map[s][0]}>{map[s][1]}</Pill>;
}

function IntegrationCard({ i, onEdit }: { i: Integration; onEdit: () => void }) {
  const tr = useTr();
  const num = useNum();
  const save = useSaveIntegration();
  const test = useTestIntegration();
  const [confirmOff, setConfirmOff] = useState(false);
  const status = integrationStatus(i);

  return (
    <article className="flex flex-col rounded-2xl border bg-card p-4" data-integration={i.id}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            status === "connected"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <PlugZap className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{i.name}</h3>
            <StatusPill s={status} />
            {i.mode && (
              <Pill tone={i.mode === "live" ? "offer" : "muted"}>
                {i.mode === "live" ? "LIVE" : "Sandbox"}
              </Pill>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{i.purpose}</p>
        </div>
        {!i.manageHref && (
          <Switch
            checked={i.enabled}
            onCheckedChange={(v) =>
              v ? save.mutate({ id: i.id, enabled: true }) : setConfirmOff(true)
            }
            aria-label={`${i.name} on/off`}
          />
        )}
      </div>

      {i.fields.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {i.fields.map((f) => (
            <li key={f.key} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="min-w-0 truncate font-mono">
                {f.secret ? (f.set ? `••••${f.last4}` : "—") : f.value || "—"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {status === "connected" && i.usage && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{i.usage.label}</span>
            <span>
              {num(i.usage.used)}/{num(i.usage.limit)}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (i.usage.used / i.usage.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {i.lastCheck && (
        <output
          className={cn(
            "mt-3 block rounded-lg px-3 py-2 text-xs font-medium",
            i.lastCheck.ok ? "bg-offer-soft text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          {i.lastCheck.ok ? "✓" : "✕"} {i.lastCheck.message} · {num(i.lastCheck.ms)}ms ·{" "}
          {i.lastCheck.at}
        </output>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {i.manageHref ? (
          <Button asChild size="sm" variant="outline">
            <Link to={i.manageHref}>{tr("বিজ্ঞাপন সেকশনে ম্যানেজ করুন", "Manage in Ads")}</Link>
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={onEdit}>
              <KeyRound className="mr-1.5 h-4 w-4" />
              {status === "not_configured" ? tr("সেটআপ", "Set up") : tr("সম্পাদনা", "Edit")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={test.isPending}
              onClick={() => test.mutate(i.id)}
            >
              {test.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="mr-1.5 h-4 w-4" />
              )}
              {tr("টেস্ট করুন", "Test")}
            </Button>
          </>
        )}
        <Button asChild size="sm" variant="ghost">
          <a href={i.docsUrl} target="_blank" rel="noopener noreferrer">
            {tr("ডক", "Docs")} <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        onConfirm={() => save.mutate({ id: i.id, enabled: false })}
        title={tr(`${i.name} বন্ধ করবেন?`, `Turn off ${i.name}?`)}
        desc={tr(
          "বন্ধ থাকলে এই সেবার ওপর নির্ভর করা ফিচার কাজ করবে না। কী মুছবে না।",
          "Features that rely on it stop working. Keys are kept.",
        )}
        confirmLabel={tr("বন্ধ করুন", "Turn off")}
        danger
      />
    </article>
  );
}

function EditDialog({ i, onClose }: { i: Integration; onClose: () => void }) {
  const tr = useTr();
  const save = useSaveIntegration();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [mode, setMode] = useState(i.mode);
  const [copied, setCopied] = useState(false);
  const changed = Object.keys(vals).length > 0 || mode !== i.mode;
  const webhook = i.webhook ? `${window.location.origin}${i.webhook}` : null;
  const set = (k: string, v: string) => setVals((cur) => ({ ...cur, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{i.name}</DialogTitle>
          <DialogDescription>{i.purpose}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ id: i.id, values: vals, mode: mode !== i.mode ? mode : undefined });
            onClose();
          }}
        >
          {i.mode && (
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold">{tr("মোড", "Mode")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["sandbox", "live"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-xl border p-3 text-sm font-semibold",
                      mode === m ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                    )}
                  >
                    {m === "live" ? tr("লাইভ (আসল টাকা)", "Live (real money)") : "Sandbox (টেস্ট)"}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {i.fields.map((f) =>
            f.options ? (
              <SelectField
                key={f.key}
                label={f.label}
                value={vals[f.key] ?? f.value ?? ""}
                onChange={(v) => set(f.key, v)}
                placeholder={tr("বাছাই করুন", "Choose")}
                options={f.options.map((o) => ({ value: o, label: o }))}
              />
            ) : f.secret ? (
              <div key={f.key} className="space-y-1">
                <Field
                  label={f.label}
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  value={vals[f.key] ?? ""}
                  placeholder={
                    f.set
                      ? tr(
                          `সেট আছে (••••${f.last4}) — নতুন দিলে বদলাবে`,
                          `Set (••••${f.last4}) — type to replace`,
                        )
                      : (f.placeholder ?? tr("এখানে পেস্ট করুন", "Paste here"))
                  }
                  hint={
                    vals[f.key] === "" && f.set
                      ? tr("সংরক্ষণ করলে এই কী মুছে যাবে", "Saving will remove this key")
                      : f.hint
                  }
                  onChange={(e) => set(f.key, e.target.value)}
                />
                {f.set && vals[f.key] === undefined && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-destructive hover:underline"
                    onClick={() => set(f.key, "")}
                  >
                    {tr("কী মুছুন", "Remove key")}
                  </button>
                )}
              </div>
            ) : (
              <Field
                key={f.key}
                label={f.label}
                spellCheck={false}
                value={vals[f.key] ?? f.value ?? ""}
                placeholder={f.placeholder}
                hint={f.hint}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ),
          )}

          {webhook && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">
                {tr("Webhook / Callback URL", "Webhook / callback URL")}
              </p>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 truncate rounded-xl border bg-muted px-3 py-2.5 text-xs">
                  {webhook}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={tr("কপি", "Copy")}
                  onClick={() => {
                    navigator.clipboard?.writeText(webhook).catch(() => {});
                    setCopied(true);
                  }}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  "প্রোভাইডারের ড্যাশবোর্ডে এটা বসান। লাইভে আপনার API ডোমেইন দিয়ে বদলাবে।",
                  "Paste this into the provider's dashboard. In production it uses your API domain.",
                )}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tr("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={!changed}>
              {tr("সংরক্ষণ", "Save")}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {tr("সংরক্ষণের পর “টেস্ট করুন” চাপুন", "Press “Test” after saving")}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
