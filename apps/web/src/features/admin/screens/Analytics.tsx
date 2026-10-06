import { QueryState } from "@/features/data/QueryState";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { categoryOf } from "@/features/feed/types";
import { Eye, MousePointerClick, Wallet } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAdminStats } from "../data/hooks";
import { AdminPage, Panel, StatCard } from "../kit";
import { ActivityChart } from "./Dashboard";

export function Analytics() {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const { data: s, isLoading, error, refetch } = useAdminStats();
  const maxCat = Math.max(1, ...(s?.byCategory.map((c) => c.count) ?? [1]));
  const maxDist = Math.max(1, ...(s?.topDistricts.map((c) => c.count) ?? [1]));

  return (
    <AdminPage
      title={tr("অ্যানালিটিক্স", "Analytics")}
      desc={tr("প্ল্যাটফর্মের বৃদ্ধি ও আয়", "Growth and revenue")}
    >
      <Helmet>
        <title>{tr("অ্যানালিটিক্স", "Analytics")} — ReuseDo Admin</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        {s && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label={tr("বিজ্ঞাপন ইম্প্রেশন", "Ad impressions")}
                value={num(s.ads.impressions)}
                icon={<Eye className="h-5 w-5" />}
              />
              <StatCard
                label={tr("ক্লিক", "Clicks")}
                value={num(s.ads.clicks)}
                icon={<MousePointerClick className="h-5 w-5" />}
              />
              <StatCard
                label={tr("আনুমানিক আয় (৳)", "Est. revenue (৳)")}
                value={`৳${num(s.ads.estRevenue)}`}
                icon={<Wallet className="h-5 w-5" />}
              />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              {tr(
                "আয় Ad Manager রিপোর্টে চূড়ান্ত হয়; এখানে অনুমান।",
                "Revenue is final in Ad Manager; this is an estimate.",
              )}
            </p>

            <Panel title={tr("নতুন ইউজার", "New sign-ups")}>
              <ActivityChart data={s.series} keys={[["signups", "var(--chart-2)"]]} />
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel title={tr("ক্যাটাগরি অনুযায়ী পোস্ট", "Posts by category")}>
                <Bars
                  rows={s.byCategory.map((c) => ({
                    label: `${categoryOf(c.category).emoji} ${lang === "bn" ? categoryOf(c.category).bn : categoryOf(c.category).en}`,
                    value: c.count,
                  }))}
                  max={maxCat}
                />
              </Panel>
              <Panel title={tr("শীর্ষ জেলা", "Top districts")}>
                <Bars
                  rows={s.topDistricts.map((d) => ({ label: d.district, value: d.count }))}
                  max={maxDist}
                />
              </Panel>
            </div>
          </>
        )}
      </QueryState>
    </AdminPage>
  );
}

function Bars({ rows, max }: { rows: { label: string; value: number }[]; max: number }) {
  const num = useNum();
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="mb-1 flex justify-between gap-2">
            <span>{r.label}</span>
            <span className="font-bold">{num(r.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
