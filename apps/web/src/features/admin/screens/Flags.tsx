import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Switch } from "@/shared/components/ui";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminFlags, useSetFlag } from "../data/hooks";
import type { AdminFlag } from "../data/types";
import { AdminPage, ConfirmDialog } from "../kit";

/** Switches that need a second click because turning them off affects every user. */
const RISKY = new Set(["new_signups", "courier", "ads_enabled"]);

export function Flags() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminFlags();
  const set = useSetFlag();
  const [pending, setPending] = useState<AdminFlag | null>(null);

  const toggle = (f: AdminFlag, v: boolean) =>
    !v && RISKY.has(f.key) ? setPending(f) : set.mutate({ key: f.key, enabled: v });

  return (
    <AdminPage
      title={tr("ফিচার ফ্ল্যাগ", "Feature flags")}
      desc={tr("কোড না বদলে ফিচার চালু/বন্ধ", "Turn features on or off without a deploy")}
    >
      <Helmet>
        <title>{tr("ফিচার", "Features")} — ReuseDo Admin</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <ul className="max-w-2xl divide-y overflow-hidden rounded-2xl border bg-card">
          {data.map((f) => (
            <li key={f.key} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold">{f.label}</p>
                <p className="text-sm text-muted-foreground">{f.description}</p>
                <code className="text-xs text-muted-foreground">{f.key}</code>
              </div>
              <Switch
                checked={f.enabled}
                onCheckedChange={(v) => toggle(f, v)}
                aria-label={f.label}
              />
            </li>
          ))}
        </ul>
      </QueryState>
      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        danger
        title={tr(`“${pending?.label ?? ""}” বন্ধ করবেন?`, `Turn off “${pending?.label ?? ""}”?`)}
        desc={tr("এটা সব ইউজারের ওপর সাথে সাথে প্রভাব ফেলবে।", "This affects every user immediately.")}
        confirmLabel={tr("বন্ধ করুন", "Turn off")}
        onConfirm={() => pending && set.mutate({ key: pending.key, enabled: false })}
      />
    </AdminPage>
  );
}
