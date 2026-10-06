import { QueryState } from "@/features/data/QueryState";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { Button } from "@/shared/components/ui";
import { Boxes, Flag, Repeat, ShieldAlert, Truck, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminAudit, useAdminStats } from "../data/hooks";
import { AdminPage, Panel, StatCard } from "../kit";

export function Dashboard() {
  const tr = useTr();
  const num = useNum();
  const { data: s, isLoading, error, refetch } = useAdminStats();
  const { data: audit = [] } = useAdminAudit();

  const todo = s
    ? [
        {
          n: s.pendingCourier,
          label: tr("কুরিয়ার রিকোয়েস্ট অনুমোদনের অপেক্ষায়", "courier requests awaiting approval"),
          href: "/admin/courier",
          icon: Truck,
        },
        {
          n: s.openReports,
          label: tr("খোলা রিপোর্ট", "open reports"),
          href: "/admin/reports",
          icon: Flag,
        },
        {
          n: s.pendingVerifications,
          label: tr("অ্যাকাউন্ট যাচাই বাকি", "accounts to review"),
          href: "/admin/verification",
          icon: ShieldAlert,
        },
      ].filter((t) => t.n > 0)
    : [];

  return (
    <AdminPage
      title={tr("ড্যাশবোর্ড", "Dashboard")}
      desc={tr("আজকের অবস্থা এক নজরে", "Today at a glance")}
    >
      <Helmet>
        <title>{tr("ড্যাশবোর্ড", "Dashboard")} — ReuseDo Admin</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        {s && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label={tr("মোট ইউজার", "Users")}
                value={num(s.users)}
                delta={s.usersDelta}
                icon={<Users className="h-5 w-5" />}
                href="/admin/users"
              />
              <StatCard
                label={tr("চালু পোস্ট", "Active posts")}
                value={num(s.activePosts)}
                delta={s.postsDelta}
                icon={<Boxes className="h-5 w-5" />}
                href="/admin/posts"
              />
              <StatCard
                label={tr("এই মাসের লেনদেন", "Exchanges / month")}
                value={num(s.exchangesMonth)}
                delta={s.exchangesDelta}
                icon={<Repeat className="h-5 w-5" />}
                href="/admin/exchanges"
              />
              <StatCard
                label={tr("কুরিয়ার বাকি", "Courier pending")}
                value={num(s.pendingCourier)}
                icon={<Truck className="h-5 w-5" />}
                href="/admin/courier"
                tone={s.pendingCourier ? "warning" : "default"}
              />
              <StatCard
                label={tr("খোলা রিপোর্ট", "Open reports")}
                value={num(s.openReports)}
                icon={<Flag className="h-5 w-5" />}
                href="/admin/reports"
                tone={s.openReports ? "danger" : "default"}
              />
              <StatCard
                label={tr("যাচাই বাকি", "To review")}
                value={num(s.pendingVerifications)}
                icon={<ShieldAlert className="h-5 w-5" />}
                href="/admin/verification"
                tone={s.pendingVerifications ? "warning" : "default"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title={tr("গত ১৪ দিন", "Last 14 days")} className="lg:col-span-2">
                <div className="mb-2 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                  <Legend color="var(--chart-1)" label={tr("নতুন পোস্ট", "New posts")} />
                  <Legend color="var(--chart-3)" label={tr("লেনদেন", "Exchanges")} />
                </div>
                <ActivityChart data={s.series} />
              </Panel>

              <div className="space-y-4">
                <Panel title={tr("এখনই দেখুন", "Needs your attention")}>
                  {todo.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      🎉 {tr("সব ঠিক আছে", "All clear")}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {todo.map((t) => (
                        <li key={t.href}>
                          <Link
                            to={t.href}
                            className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/50"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                              <t.icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1 text-sm">
                              <b className="text-base">{num(t.n)}</b> {t.label}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel
                  title={tr("সাম্প্রতিক কাজ", "Recent activity")}
                  action={
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/audit">{tr("সব", "All")}</Link>
                    </Button>
                  }
                >
                  <ul className="space-y-2.5 text-sm">
                    {audit.slice(0, 4).map((a) => (
                      <li key={a.id} className="flex items-start gap-2">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span className="min-w-0">
                          <span className="font-semibold">{a.action}</span>
                          <span className="text-muted-foreground"> · {a.target}</span>
                          <span className="block text-xs text-muted-foreground">
                            {a.actor} · {a.when}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </AdminPage>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function ActivityChart({
  data,
  keys = [
    ["posts", "var(--chart-1)"],
    ["exchanges", "var(--chart-3)"],
  ],
}: {
  data: Record<string, number | string>[];
  keys?: [string, string][];
}) {
  const lang = useLang((s) => s.lang);
  const num = useNum();
  return (
    <div
      className="h-64 w-full lg:h-[21rem]"
      role="img"
      aria-label={lang === "bn" ? "কার্যকলাপের চার্ট" : "Activity chart"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => num(v)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            formatter={(v) => num(String(v))}
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          {keys.map(([k, color]) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={color}
              strokeWidth={2.5}
              fill={color}
              fillOpacity={0.12}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { Pill };
