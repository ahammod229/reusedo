import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Field } from "@/pages/auth/components/Field";
import { Button, Switch } from "@/shared/components/ui";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminSettings, useSaveSettings } from "../data/hooks";
import type { AdminSettings } from "../data/types";
import { AdminPage, Panel } from "../kit";

export function Settings() {
  const tr = useTr();
  const { data, isLoading, error, refetch } = useAdminSettings();
  const save = useSaveSettings();
  const [s, setS] = useState<AdminSettings | null>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => data && setS(data), [data]);

  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => {
    setS((cur) => (cur ? { ...cur, [k]: v } : cur));
    setOk(false);
  };
  const intIn = (v: string, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.parseInt(v, 10) || min));
  const valid = !!s && /^\S+@\S+\.\S+$/.test(s.supportEmail);

  return (
    <AdminPage
      title={tr("প্ল্যাটফর্ম সেটিংস", "Platform settings")}
      desc={tr("শুধু সুপার অ্যাডমিন বদলাতে পারেন", "Super admins only")}
    >
      <Helmet>
        <title>{tr("সেটিংস", "Settings")} — ReuseDo Admin</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        {s && (
          <form
            className="max-w-2xl space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(s);
              setOk(true);
            }}
          >
            <Panel title={tr("সাধারণ", "General")}>
              <div className="space-y-4">
                <Field
                  label={tr("সাপোর্ট ইমেইল", "Support email")}
                  type="email"
                  value={s.supportEmail}
                  onChange={(e) => set("supportEmail", e.target.value)}
                  error={valid ? undefined : tr("সঠিক ইমেইল দিন", "Enter a valid email")}
                />
                <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">{tr("মেইনটেন্যান্স মোড", "Maintenance mode")}</p>
                    <p className="text-sm text-muted-foreground">
                      {tr(
                        "চালু করলে সাধারণ ইউজাররা সাইটে ঢুকতে পারবে না",
                        "Regular users can't use the site while on",
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={s.maintenanceMode}
                    onCheckedChange={(v) => set("maintenanceMode", v)}
                    aria-label="maintenance"
                  />
                </div>
              </div>
            </Panel>

            <Panel title={tr("সীমা", "Limits")}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label={tr("AI ড্রাফট/দিন/ইউজার", "AI drafts / user / day")}
                  type="number"
                  inputMode="numeric"
                  value={s.aiDailyLimit}
                  hint={tr("Gemini ফ্রি টিয়ারের সীমা বাঁচাতে", "Protects Gemini free-tier quota")}
                  onChange={(e) => set("aiDailyLimit", intIn(e.target.value, 1, 100))}
                />
                <Field
                  label={tr("সর্বোচ্চ ছবি/পোস্ট", "Max photos / post")}
                  type="number"
                  inputMode="numeric"
                  value={s.maxPhotos}
                  onChange={(e) => set("maxPhotos", intIn(e.target.value, 1, 10))}
                />
                <Field
                  label={tr("রিকোয়েস্টের মেয়াদ (দিন)", "Request expiry (days)")}
                  type="number"
                  inputMode="numeric"
                  value={s.requestExpiryDays}
                  onChange={(e) => set("requestExpiryDays", intIn(e.target.value, 1, 30))}
                />
              </div>
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
    </AdminPage>
  );
}
