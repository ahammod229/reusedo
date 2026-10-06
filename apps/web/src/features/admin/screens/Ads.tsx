import { QueryState } from "@/features/data/QueryState";
import { type AdPlacement, adState, safeAdUrl } from "@/features/data/platformStore";
import { useNum, useTr } from "@/features/feed/i18n";
import { compressImage } from "@/features/feed/image";
import { Pill } from "@/features/feed/parts";
import { CATEGORIES } from "@/features/feed/types";
import { BD_DIVISIONS } from "@/features/geo/bd";
import { Field, SelectField } from "@/pages/auth/components/Field";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Switch,
  cn,
} from "@/shared/components/ui";
import { Eye, ImagePlus, Megaphone, MousePointerClick, Percent, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdNetwork, useAdminAds, useDeleteAd, useSaveAd, useSaveAdNetwork } from "../data/hooks";
import type { AdCampaign, AdNetworkSettings } from "../data/types";
import {
  AdminPage,
  ConfirmDialog,
  DataTable,
  FilterTabs,
  Panel,
  StatCard,
  ToggleRow,
} from "../kit";

type View = "campaigns" | "network";
type F = "all" | "active" | "paused" | "scheduled" | "ended";

const PLACEMENTS: { id: AdPlacement; bn: string; en: string }[] = [
  { id: "feed", bn: "ফিডে পোস্টের মাঝে", en: "In the feed" },
  { id: "sidebar", bn: "ডেস্কটপ সাইডবার", en: "Desktop sidebar" },
  { id: "post_detail", bn: "পোস্টের পেজে", en: "Post page" },
];
const DISTRICTS = BD_DIVISIONS.flatMap((d) => d.districts).sort((a, b) => a.localeCompare(b, "bn"));
const today = () => new Date().toISOString().slice(0, 10);

const blank = (): AdCampaign => ({
  id: `ad${Date.now()}`,
  advertiser: "",
  headline: "",
  body: "",
  cta: "দেখুন",
  url: "https://",
  placements: ["feed"],
  districts: [],
  categories: [],
  start: today(),
  weight: 5,
  paused: false,
  impressions: 0,
  clicks: 0,
});

function StatePill({ a }: { a: AdCampaign }) {
  const tr = useTr();
  const s = adState(a);
  return s === "active" ? (
    <Pill tone="success">{tr("চলছে", "Live")}</Pill>
  ) : s === "paused" ? (
    <Pill tone="warning">{tr("থামানো", "Paused")}</Pill>
  ) : s === "scheduled" ? (
    <Pill>{tr("শিডিউলড", "Scheduled")}</Pill>
  ) : (
    <Pill tone="danger">{tr("শেষ", "Ended")}</Pill>
  );
}

const ctr = (a: { impressions: number; clicks: number }) =>
  a.impressions ? (a.clicks / a.impressions) * 100 : 0;

export function Ads() {
  const tr = useTr();
  const [view, setView] = useState<View>("campaigns");
  return (
    <AdminPage
      title={tr("বিজ্ঞাপন ম্যানেজার", "Ads manager")}
      desc={tr(
        "নিজের বিজ্ঞাপন যোগ, বদল, থামানো ও মুছুন; Google Ad Manager (AdX) ও কতবার দেখাবে ঠিক করুন",
        "Add, edit, pause and remove your own ads; configure Google Ad Manager (AdX) and frequency",
      )}
    >
      <Helmet>
        <title>{tr("বিজ্ঞাপন", "Ads")} — ReuseDo Admin</title>
      </Helmet>
      <FilterTabs<View>
        value={view}
        onChange={setView}
        options={[
          { value: "campaigns", label: tr("আমার বিজ্ঞাপন", "Direct ads") },
          { value: "network", label: tr("AdX ও দেখানোর নিয়ম", "AdX & delivery rules") },
        ]}
      />
      {view === "campaigns" ? <Campaigns /> : <Network />}
    </AdminPage>
  );
}

function Campaigns() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useAdminAds();
  const save = useSaveAd();
  const del = useDeleteAd();
  const [f, setF] = useState<F>("all");
  const [edit, setEdit] = useState<AdCampaign | null>(null);
  const [toDelete, setToDelete] = useState<AdCampaign | null>(null);
  const rows = data.filter((a) => f === "all" || adState(a) === f);
  const n = (s: F) => data.filter((a) => adState(a) === s).length;
  const imp = data.reduce((x, a) => x + a.impressions, 0);
  const clk = data.reduce((x, a) => x + a.clicks, 0);

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={tr("চলমান বিজ্ঞাপন", "Live ads")}
          value={num(n("active"))}
          icon={<Megaphone className="h-5 w-5" />}
        />
        <StatCard
          label={tr("দেখা হয়েছে", "Impressions")}
          value={num(imp)}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          label={tr("ক্লিক", "Clicks")}
          value={num(clk)}
          icon={<MousePointerClick className="h-5 w-5" />}
        />
        <StatCard
          label="CTR"
          value={`${num(ctr({ impressions: imp, clicks: clk }).toFixed(2))}%`}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<F>
          value={f}
          onChange={setF}
          options={[
            { value: "all", label: tr("সব", "All"), count: data.length },
            { value: "active", label: tr("চলছে", "Live"), count: n("active") },
            { value: "paused", label: tr("থামানো", "Paused"), count: n("paused") },
            { value: "scheduled", label: tr("শিডিউলড", "Scheduled"), count: n("scheduled") },
            { value: "ended", label: tr("শেষ", "Ended"), count: n("ended") },
          ]}
        />
        <Button onClick={() => setEdit(blank())}>
          <Plus className="mr-1.5 h-4 w-4" /> {tr("নতুন বিজ্ঞাপন", "New ad")}
        </Button>
      </div>

      <DataTable
        rows={rows}
        rowKey={(a) => a.id}
        empty={tr("কোনো বিজ্ঞাপন নেই — “নতুন বিজ্ঞাপন” চাপুন", "No ads — press “New ad”")}
        cols={[
          {
            key: "ad",
            header: tr("বিজ্ঞাপন", "Ad"),
            primary: true,
            cell: (a) => (
              <div className="flex min-w-0 items-center gap-3">
                {a.image ? (
                  <img
                    src={a.image}
                    alt=""
                    className="h-11 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.headline}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {a.advertiser}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "where",
            header: tr("কোথায়", "Where"),
            cell: (a) => (
              <div className="text-xs">
                <p>
                  {a.placements
                    .map((id) => {
                      const x = PLACEMENTS.find((y) => y.id === id);
                      return x ? tr(x.bn, x.en) : id;
                    })
                    .join(", ")}
                </p>
                <p className="text-muted-foreground">
                  {a.districts.length ? a.districts.join(", ") : tr("সারা দেশ", "Nationwide")}
                  {a.categories.length > 0 &&
                    ` · ${num(a.categories.length)} ${tr("ক্যাটাগরি", "categories")}`}
                </p>
              </div>
            ),
          },
          {
            key: "when",
            header: tr("সময়", "Schedule"),
            cell: (a) => (
              <span className="text-xs">
                {num(a.start)} → {a.end ? num(a.end) : tr("চলবে", "ongoing")}
              </span>
            ),
          },
          {
            key: "perf",
            header: tr("ফলাফল", "Results"),
            cell: (a) => (
              <span className="text-xs">
                {num(a.impressions)} / {num(a.clicks)} · <b>{num(ctr(a).toFixed(1))}%</b>
              </span>
            ),
          },
          { key: "state", header: tr("অবস্থা", "State"), cell: (a) => <StatePill a={a} /> },
          {
            key: "actions",
            header: "",
            actions: true,
            cell: (a) => (
              <>
                <Switch
                  checked={!a.paused}
                  onCheckedChange={(v) => save.mutate({ ...a, paused: !v })}
                  aria-label={`${a.headline} ${tr("চালু/বন্ধ", "on/off")}`}
                />
                <Button size="sm" variant="outline" onClick={() => setEdit(a)}>
                  {tr("সম্পাদনা", "Edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setToDelete(a)}
                >
                  {tr("মুছুন", "Delete")}
                </Button>
              </>
            ),
          },
        ]}
      />

      {edit && (
        <AdEditor
          key={edit.id}
          initial={edit}
          isNew={!data.some((a) => a.id === edit.id)}
          onClose={() => setEdit(null)}
          onSave={(a) => {
            save.mutate(a);
            setEdit(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        title={tr("বিজ্ঞাপন মুছবেন?", "Delete this ad?")}
        desc={tr(
          `“${toDelete?.headline}” — এর ফলাফলের হিসাবও মুছে যাবে। শুধু থামাতে চাইলে সুইচ বন্ধ করুন।`,
          `“${toDelete?.headline}” and its stats will be removed. To keep it, just pause it.`,
        )}
        confirmLabel={tr("মুছুন", "Delete")}
        danger
      />
    </QueryState>
  );
}

function AdEditor({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: AdCampaign;
  isNew: boolean;
  onClose: () => void;
  onSave: (a: AdCampaign) => void;
}) {
  const tr = useTr();
  const num = useNum();
  const [a, setA] = useState<AdCampaign>(initial);
  const [busy, setBusy] = useState(false);
  const [district, setDistrict] = useState("");
  const set = <K extends keyof AdCampaign>(k: K, v: AdCampaign[K]) =>
    setA((c) => ({ ...c, [k]: v }));
  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const e = {
    advertiser: !a.advertiser.trim(),
    headline: a.headline.trim().length < 5,
    url: !safeAdUrl(a.url),
    placements: a.placements.length === 0,
    dates: !!a.end && a.end < a.start,
  };
  const valid = !Object.values(e).some(Boolean);

  const onImage = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const small = await compressImage(file);
    // Mock keeps a data: URL; the API version uploads to storage and stores the URL.
    const url = await new Promise<string>((r) => {
      const fr = new FileReader();
      fr.onload = () => r(String(fr.result));
      fr.readAsDataURL(small);
    });
    set("image", url);
    setBusy(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? tr("নতুন বিজ্ঞাপন", "New ad") : tr("বিজ্ঞাপন সম্পাদনা", "Edit ad")}
          </DialogTitle>
          <DialogDescription>
            {tr("ডান পাশে দেখুন ফিডে কেমন দেখাবে।", "The preview shows how it looks in the feed.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (valid) onSave({ ...a, url: safeAdUrl(a.url) ?? a.url });
            }}
            id="ad-form"
          >
            <Field
              label={tr("বিজ্ঞাপনদাতা", "Advertiser")}
              value={a.advertiser}
              maxLength={40}
              onChange={(ev) => set("advertiser", ev.target.value)}
            />
            <Field
              label={tr("শিরোনাম", "Headline")}
              value={a.headline}
              maxLength={60}
              hint={`${num(a.headline.length)}/৬০`}
              onChange={(ev) => set("headline", ev.target.value)}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">{tr("বিবরণ", "Text")}</span>
              <textarea
                value={a.body}
                maxLength={120}
                rows={2}
                onChange={(ev) => set("body", ev.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <Field
                label={tr("বাটন", "Button")}
                value={a.cta}
                maxLength={20}
                onChange={(ev) => set("cta", ev.target.value)}
              />
              <Field
                label={tr("লিংক", "Link")}
                type="url"
                inputMode="url"
                value={a.url}
                error={
                  a.url.length > 8 && e.url
                    ? tr("https:// দিয়ে সঠিক লিংক দিন", "Enter a valid https:// link")
                    : undefined
                }
                onChange={(ev) => set("url", ev.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-semibold">
                {tr("ছবি (ঐচ্ছিক, ১৬:৯)", "Image (optional, 16:9)")}
              </span>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-accent">
                  <ImagePlus className="h-4 w-4" />
                  {busy
                    ? tr("প্রসেস হচ্ছে…", "Processing…")
                    : a.image
                      ? tr("বদলান", "Replace")
                      : tr("আপলোড", "Upload")}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(ev) => onImage(ev.target.files?.[0])}
                  />
                </label>
                {a.image && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => set("image", undefined)}
                  >
                    {tr("সরান", "Remove")}
                  </Button>
                )}
              </div>
            </div>

            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold">{tr("কোথায় দেখাবে", "Placements")}</legend>
              <div className="flex flex-wrap gap-2">
                {PLACEMENTS.map((p) => (
                  <Chip
                    key={p.id}
                    on={a.placements.includes(p.id)}
                    onClick={() => set("placements", toggle(a.placements, p.id))}
                  >
                    {tr(p.bn, p.en)}
                  </Chip>
                ))}
              </div>
              {e.placements && (
                <p className="text-xs font-medium text-destructive">
                  {tr("অন্তত একটি বাছুন", "Pick at least one")}
                </p>
              )}
            </fieldset>

            <div className="space-y-1.5">
              <SelectField
                label={tr("জেলা টার্গেট (খালি = সারা দেশ)", "Districts (empty = nationwide)")}
                value={district}
                onChange={(v) => {
                  if (v && !a.districts.includes(v)) set("districts", [...a.districts, v]);
                  setDistrict("");
                }}
                placeholder={tr("জেলা যোগ করুন…", "Add a district…")}
                options={DISTRICTS.filter((d) => !a.districts.includes(d)).map((d) => ({
                  value: d,
                  label: d,
                }))}
              />
              {a.districts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {a.districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        set(
                          "districts",
                          a.districts.filter((x) => x !== d),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                      aria-label={`${d} ${tr("সরান", "remove")}`}
                    >
                      {d} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold">
                {tr("ক্যাটাগরি টার্গেট (খালি = সব)", "Categories (empty = all)")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.id}
                    on={a.categories.includes(c.id)}
                    onClick={() => set("categories", toggle(a.categories, c.id))}
                  >
                    {c.emoji} {tr(c.bn, c.en)}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={tr("শুরু", "Start")}
                type="date"
                value={a.start}
                onChange={(ev) => set("start", ev.target.value || today())}
              />
              <Field
                label={tr("শেষ (ঐচ্ছিক)", "End (optional)")}
                type="date"
                value={a.end ?? ""}
                min={a.start}
                error={e.dates ? tr("শুরুর আগে হতে পারে না", "Can't be before start") : undefined}
                onChange={(ev) => set("end", ev.target.value || undefined)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ad-weight" className="flex justify-between text-sm font-semibold">
                <span>{tr("অগ্রাধিকার", "Priority")}</span>
                <span className="text-primary">{num(a.weight)}/১০</span>
              </label>
              <input
                id="ad-weight"
                type="range"
                min={1}
                max={10}
                value={a.weight}
                onChange={(ev) => set("weight", Number(ev.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                {tr(
                  "বেশি হলে অন্য বিজ্ঞাপনের চেয়ে বেশিবার দেখাবে",
                  "Higher shows more often than other ads",
                )}
              </p>
            </div>
          </form>

          <div className="space-y-2 md:sticky md:top-0 md:self-start">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {tr("প্রিভিউ", "Preview")}
            </p>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 pt-3 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">
                  {tr("স্পন্সরড", "Sponsored")}
                </span>
                <span className="truncate">{a.advertiser || tr("বিজ্ঞাপনদাতা", "Advertiser")}</span>
              </div>
              {a.image && (
                <img src={a.image} alt="" className="mt-3 aspect-[16/9] w-full object-cover" />
              )}
              <div className="p-4 pt-3">
                <p className="font-semibold leading-snug">
                  {a.headline || tr("শিরোনাম", "Headline")}
                </p>
                {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
                <span className="mt-3 inline-flex rounded-full border px-4 py-1.5 text-sm font-medium">
                  {a.cta || "…"}
                </span>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {tr("বাতিল", "Cancel")}
          </Button>
          <Button type="submit" form="ad-form" className="flex-1" disabled={!valid || busy}>
            {isNew ? tr("প্রকাশ করুন", "Publish") : tr("সংরক্ষণ", "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  on,
  onClick,
  children,
}: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        on ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function Network() {
  const tr = useTr();
  const num = useNum();
  const { data, isLoading, error, refetch } = useAdNetwork();
  const save = useSaveAdNetwork();
  const [s, setS] = useState<AdNetworkSettings | null>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => data && setS(data), [data]);
  const upd = (fn: (d: AdNetworkSettings) => void) => {
    setS((c) => {
      if (!c) return c;
      const n = structuredClone(c);
      fn(n);
      return n;
    });
    setOk(false);
  };
  const codeBad = !!s && s.adxEnabled && !/^\d{4,12}$/.test(s.networkCode);
  const perSession = s?.adsEnabled ? Math.min(s.sessionCap, Math.floor(30 / s.every)) : 0;

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
      {s && (
        <form
          className="max-w-3xl space-y-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            save.mutate(s);
            setOk(true);
          }}
        >
          <Panel>
            <div className="space-y-3">
              <ToggleRow
                title={tr("বিজ্ঞাপন চালু", "Ads on")}
                desc={tr("বন্ধ করলে সাইটে কোনো বিজ্ঞাপন দেখাবে না", "When off, no ads show anywhere")}
                checked={s.adsEnabled}
                onChange={(v) =>
                  upd((d) => {
                    d.adsEnabled = v;
                  })
                }
              />
              <ToggleRow
                title="Google Ad Manager (AdX)"
                desc={tr("আপনার AdX অ্যাকাউন্ট দিয়ে খালি জায়গা পূরণ", "Fill slots with your AdX account")}
                checked={s.adxEnabled}
                onChange={(v) =>
                  upd((d) => {
                    d.adxEnabled = v;
                  })
                }
              >
                <div className="space-y-3">
                  <Field
                    label="Network code"
                    inputMode="numeric"
                    value={s.networkCode}
                    placeholder="21234567890"
                    error={
                      codeBad
                        ? tr(
                            "শুধু সংখ্যা — Ad Manager → Admin → Global settings",
                            "Digits only — Ad Manager → Admin → Global settings",
                          )
                        : undefined
                    }
                    onChange={(ev) =>
                      upd((d) => {
                        d.networkCode = ev.target.value.trim();
                      })
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PLACEMENTS.map((p) => (
                      <Field
                        key={p.id}
                        label={`Ad unit — ${tr(p.bn, p.en)}`}
                        value={s.units[p.id]}
                        onChange={(ev) =>
                          upd((d) => {
                            d.units[p.id] = ev.target.value.trim();
                          })
                        }
                      />
                    ))}
                  </div>
                  <SelectField
                    label={tr("কোনটা আগে", "Which first")}
                    value={s.priority}
                    onChange={(v) =>
                      upd((d) => {
                        d.priority = v as AdNetworkSettings["priority"];
                      })
                    }
                    placeholder={tr("বাছাই করুন", "Choose")}
                    options={[
                      {
                        value: "direct_first",
                        label: tr("আমার বিজ্ঞাপন আগে, না থাকলে AdX", "Direct first, then AdX"),
                      },
                      { value: "adx_first", label: tr("সবসময় AdX", "Always AdX") },
                      { value: "mix", label: tr("পালা করে", "Alternate") },
                    ]}
                  />
                </div>
              </ToggleRow>
            </div>
          </Panel>

          <Panel
            title={tr("কতবার দেখাবে", "Frequency")}
            className={cn(!s.adsEnabled && "opacity-50")}
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="every" className="flex justify-between text-sm font-semibold">
                  <span>{tr("প্রতি কয়টি পোস্টের পর ১টি", "One ad every N posts")}</span>
                  <span className="text-primary">{num(s.every)}</span>
                </label>
                <input
                  id="every"
                  type="range"
                  min={4}
                  max={12}
                  value={s.every}
                  disabled={!s.adsEnabled}
                  onChange={(ev) =>
                    upd((d) => {
                      d.every = Number(ev.target.value);
                    })
                  }
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  {tr(
                    "কম = বেশি আয়, কিন্তু বিরক্তি বাড়ে। প্রস্তাবিত ৬–৮।",
                    "Lower = more revenue but more annoyance. 6–8 recommended.",
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cap" className="flex justify-between text-sm font-semibold">
                  <span>{tr("এক পেজে সর্বোচ্চ", "Max per page")}</span>
                  <span className="text-primary">{num(s.sessionCap)}</span>
                </label>
                <input
                  id="cap"
                  type="range"
                  min={1}
                  max={15}
                  value={s.sessionCap}
                  disabled={!s.adsEnabled}
                  onChange={(ev) =>
                    upd((d) => {
                      d.sessionCap = Number(ev.target.value);
                    })
                  }
                  className="w-full accent-primary"
                />
              </div>
              <ToggleRow
                title={tr("নতুন ইউজারের প্রথম দিনে কম বিজ্ঞাপন", "Fewer ads on a new user's first day")}
                checked={s.newUserLight}
                onChange={(v) =>
                  upd((d) => {
                    d.newUserLight = v;
                  })
                }
              />
              <p className="rounded-xl bg-muted px-3 py-2 text-sm">
                {tr(
                  `৩০টি পোস্ট স্ক্রল করলে প্রায় ${num(perSession)}টি বিজ্ঞাপন। চ্যাট, যাচাই, ঠিকানা ও পেমেন্ট পেজে কখনো বিজ্ঞাপন নেই।`,
                  `About ${perSession} ads per 30 posts. Never on chat, verification, address or payment pages.`,
                )}
              </p>
            </div>
          </Panel>

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={codeBad}>
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
