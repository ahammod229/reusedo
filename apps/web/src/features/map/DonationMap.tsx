import { QueryState } from "@/features/data/QueryState";
import { useDonationMap } from "@/features/data/hooks";
import type { DonationHub } from "@/features/data/types";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { createBdMap } from "@/features/geo/baseMap";
import { clusterByPixels } from "@/features/geo/cluster";
import { DISTRICT_CENTERS, type LatLng } from "@/features/geo/places";
import { cn } from "@/shared/components/ui";
import L from "leaflet";
import { ArrowRight, HandHeart, Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

type Hub = DonationHub & { at: LatLng };

/** Marker diameter grows with the square root of donors, so big districts don't swamp small ones. */
const sizeFor = (donors: number, max: number, small: boolean) =>
  Math.round((small ? 26 : 30) + Math.sqrt(donors / max) * (small ? 20 : 28));

export default function DonationMap() {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const { data, isLoading, error, refetch } = useDonationMap();
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof createBdMap> | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [zoom, setZoom] = useState(0);
  const [picked, setPicked] = useState<string[] | null>(null);

  const hubs = useMemo<Hub[]>(
    () =>
      (data?.hubs ?? []).flatMap((h) => {
        const at = DISTRICT_CENTERS[h.district];
        return at ? [{ ...h, at }] : [];
      }),
    [data],
  );
  const max = Math.max(1, ...hubs.map((h) => h.donors));
  const top = useMemo(() => [...hubs].sort((a, b) => b.donors - a.donors).slice(0, 5), [hubs]);
  const recent = useMemo(
    () =>
      hubs
        .filter((h) => h.recent[0])
        .sort((a, b) => Number(b.fresh) - Number(a.fresh))
        .slice(0, 4),
    [hubs],
  );
  const sel = picked ? hubs.filter((h) => picked.includes(h.district)) : [];

  // Map is created once the data (and so the box) is on screen.
  useEffect(() => {
    if (!box.current || hubs.length === 0 || api.current) return;
    const a = createBdMap(box.current, { embedded: true });
    api.current = a;
    layer.current = L.layerGroup().addTo(a.map);
    setZoom(a.map.getZoom());
    a.map.on("zoomend", () => setZoom(a.map.getZoom()));
    a.map.on("click", () => setPicked(null));
    return () => {
      a.destroy();
      api.current = null;
    };
  }, [hubs.length]);

  // Bubbles: one per district, merged when they'd overlap at this zoom (Dhaka–Gazipur–Narayanganj).
  // biome-ignore lint/correctness/useExhaustiveDependencies: `zoom` is the trigger — clusters depend on the map's current zoom
  useEffect(() => {
    const map = api.current?.map;
    const lg = layer.current;
    if (!map || !lg) return;
    lg.clearLayers();
    const small = map.getSize().x < 520;
    // Merge when bubbles (plus their name label) would touch.
    const clusters = clusterByPixels(hubs, map, small ? 58 : 66, (h) => h.donors);
    const labelled = new Set(
      [...clusters].sort((a, b) => b.weight - a.weight).slice(0, small ? 5 : 8),
    );
    for (const c of clusters) {
      const lead = c.items[0];
      const donors = c.items.reduce((n, h) => n + h.donors, 0);
      const fresh = c.items.some((h) => h.fresh);
      const size = sizeFor(donors, max, small);
      const names = c.items.map((h) => h.district);
      const active = !!picked && names.every((n) => picked.includes(n));
      const label =
        c.items.length > 1 ? `${lead.district} +${num(c.items.length - 1)}` : lead.district;
      const icon = L.divIcon({
        className: "",
        iconSize: [size, size],
        html: `<div class="rd-hub${fresh ? " is-fresh" : ""}${active ? " is-active" : ""}" style="width:${size}px;height:${size}px"><b>${num(donors)}</b></div>${labelled.has(c) ? `<span class="rd-hub__label">${label.replace(/[<>&"]/g, "")}</span>` : ""}`,
      });
      L.marker(c.at, { icon, keyboard: true, title: `${names.join(", ")}: ${donors}` })
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setPicked(names);
        })
        .addTo(lg);
    }
  }, [hubs, zoom, picked, max, num]);

  const focus = (h: Hub) => {
    setPicked([h.district]);
    api.current?.map.flyTo(h.at, Math.max(api.current.map.getZoom(), 8), { duration: 0.6 });
  };

  return (
    <section className="overflow-hidden rounded-3xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-offer-soft text-offer">
            <HandHeart className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold leading-tight">
              {tr("সারা দেশে যারা দিচ্ছেন", "Giving across the country")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {tr(
                "জেলা অনুযায়ী — কারও ঠিকানা কখনো দেখানো হয় না",
                "By district — nobody's address is ever shown",
              )}
            </p>
          </div>
        </div>
        {data && (
          <dl className="grid w-full grid-cols-3 gap-2 text-center sm:w-auto">
            <Stat value={num(data.givenToday)} label={tr("আজ দেওয়া", "given today")} />
            <Stat value={num(data.givenThisMonth)} label={tr("এই মাসে", "this month")} />
            <Stat value={num(data.districtsActive)} label={tr("জেলায় সক্রিয়", "districts")} />
          </dl>
        )}
      </div>

      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        <div className="grid gap-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="relative isolate mx-3 overflow-hidden rounded-2xl border lg:mb-3 lg:mr-0">
            <div
              ref={box}
              role="region"
              aria-label={tr("দানের মানচিত্র", "Donation map")}
              className="rd-map h-[24rem] w-full sm:h-[28rem]"
            />

            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] space-y-1 rounded-xl bg-card/95 px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
              <p className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />{" "}
                {tr("বড় বৃত্ত = বেশি দাতা", "Bigger = more givers")}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/25" />
                {tr("গত ২৪ ঘণ্টায় দান", "Gave in the last 24h")}
              </p>
            </div>

            <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  api.current?.fitCountry();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card shadow-md hover:bg-accent"
                aria-label={tr("পুরো দেশ দেখুন", "Show whole country")}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {sel.length > 0 && (
              <div className="absolute inset-x-3 bottom-3 z-[600] rounded-2xl border bg-card p-3 shadow-xl sm:left-auto sm:right-14 sm:w-80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{sel.map((h) => h.district).join(", ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {tr(
                        `${num(sel.reduce((n, h) => n + h.donors, 0))} জন দাতা · এই মাসে ${num(sel.reduce((n, h) => n + h.items, 0))}টি জিনিস`,
                        `${sel.reduce((n, h) => n + h.donors, 0)} givers · ${sel.reduce((n, h) => n + h.items, 0)} items this month`,
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPicked(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent"
                    aria-label={tr("বন্ধ করুন", "Close")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {sel
                    .filter((h) => h.recent[0])
                    .slice(0, 3)
                    .map((h) => (
                      <li key={h.district} className="flex gap-1.5">
                        <span className="text-offer">✓</span>
                        <span className="min-w-0">
                          <b>{h.recent[0].name}</b> — {h.recent[0].item}{" "}
                          <span className="text-muted-foreground">
                            ({lang === "bn" ? h.recent[0].whenBn : h.recent[0].whenEn})
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid gap-5 p-4 sm:grid-cols-2 lg:grid-cols-1 lg:pt-0">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {tr("সবচেয়ে সক্রিয় জেলা", "Most active districts")}
              </h3>
              <ol className="space-y-2">
                {top.map((h, i) => (
                  <li key={h.district}>
                    <button
                      type="button"
                      onClick={() => focus(h)}
                      className={cn(
                        "w-full rounded-lg px-1 py-0.5 text-left text-sm transition-colors hover:bg-accent/60",
                        picked?.includes(h.district) && "bg-primary/5",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 text-xs text-muted-foreground">{num(i + 1)}</span>
                        <span className="flex-1 font-semibold">{h.district}</span>
                        <span className="text-xs text-muted-foreground">
                          {num(h.donors)} {tr("জন", "givers")}
                        </span>
                      </span>
                      <span className="ml-6 mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(h.donors / max) * 100}%` }}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {tr("সাম্প্রতিক দান", "Recently given")}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {recent.map((h) => (
                  <li key={h.district} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        h.fresh ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <b>{h.recent[0].name}</b>, {h.district} — {h.recent[0].item}
                      <span className="block text-xs text-muted-foreground">
                        {lang === "bn" ? h.recent[0].whenBn : h.recent[0].whenEn}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/feed?view=map"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {tr("ম্যাপে কাছের পোস্ট দেখুন", "See nearby posts on the map")}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </QueryState>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-muted/70 px-3 py-1.5">
      <dd className="text-base font-extrabold leading-tight">{value}</dd>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
    </div>
  );
}
