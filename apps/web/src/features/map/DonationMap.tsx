import { QueryState } from "@/features/data/QueryState";
import { useDonationMap } from "@/features/data/hooks";
import type { DonationHub } from "@/features/data/types";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { BD_BOUNDS, DISTRICT_COORDS } from "@/features/geo/districts";
import { BadgeCheck, HandHeart } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";

const TILES = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const sizeFor = (donors: number, max: number) => 26 + Math.round(Math.sqrt(donors / max) * 22);

function popupFor(h: DonationHub, lang: "bn" | "en", num: (n: number) => string): HTMLElement {
  // Built with textContent, so nothing from the data is ever parsed as HTML.
  const root = document.createElement("div");
  root.className = "rd-popup";
  const title = document.createElement("strong");
  title.textContent = h.district;
  const line = document.createElement("div");
  line.textContent =
    lang === "bn"
      ? `${num(h.donors)} জন দাতা · ${num(h.items)}টি জিনিস`
      : `${h.donors} donors · ${h.items} items`;
  root.append(title, line);
  const r = h.recent[0];
  if (r) {
    const last = document.createElement("div");
    last.className = "rd-popup-recent";
    last.textContent = `✓ ${r.name} — ${r.item} (${lang === "bn" ? r.whenBn : r.whenEn})`;
    root.append(last);
  }
  return root;
}

export default function DonationMap() {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const { data, isLoading, error, refetch } = useDonationMap();
  const box = useRef<HTMLDivElement>(null);

  const hubs = useMemo(() => (data?.hubs ?? []).filter((h) => DISTRICT_COORDS[h.district]), [data]);
  const top = useMemo(() => [...hubs].sort((a, b) => b.donors - a.donors).slice(0, 5), [hubs]);
  const recent = useMemo(
    () =>
      hubs
        .filter((h) => h.recent[0])
        .sort((a, b) => Number(b.fresh) - Number(a.fresh))
        .slice(0, 8),
    [hubs],
  );

  useEffect(() => {
    if (!box.current || hubs.length === 0) return;
    const map = L.map(box.current, {
      zoomControl: true,
      scrollWheelZoom: false, // don't hijack page scroll
      dragging: !L.Browser.mobile, // one finger scrolls the page on phones
      zoomSnap: 0.25,
      minZoom: 6,
      maxZoom: 10,
      maxBounds: L.latLngBounds(BD_BOUNDS).pad(0.4),
      attributionControl: true,
    }).fitBounds(BD_BOUNDS);
    L.tileLayer(TILES, { attribution: "© OpenStreetMap contributors", maxZoom: 10 }).addTo(map);

    const max = Math.max(...hubs.map((h) => h.donors), 1);
    for (const h of hubs) {
      const size = sizeFor(h.donors, max);
      const icon = L.divIcon({
        className: "",
        iconSize: [size, size],
        html: `<span class="rd-hub${h.fresh ? " rd-fresh" : ""}" style="width:${size}px;height:${size}px">✓</span>`,
      });
      L.marker(DISTRICT_COORDS[h.district], { icon, title: h.district, alt: h.district })
        .bindPopup(popupFor(h, lang, num))
        .addTo(map);
    }
    return () => {
      map.remove();
    };
  }, [hubs, lang, num]);

  return (
    <section className="overflow-hidden rounded-3xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-offer-soft text-offer">
            <HandHeart className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold leading-tight">
              {tr("কোথা থেকে মানুষ দান করছেন", "Where people are giving")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {tr("জেলা অনুযায়ী — ঠিকানা কখনো দেখানো হয় না", "By district — addresses are never shown")}
            </p>
          </div>
        </div>
        {data && (
          <div className="flex gap-2 text-xs">
            <Stat value={num(data.givenToday)} label={tr("আজ", "today")} />
            <Stat value={num(data.givenThisMonth)} label={tr("এই মাসে", "this month")} />
            <Stat value={num(data.districtsActive)} label={tr("জেলা", "districts")} />
          </div>
        )}
      </div>

      <QueryState isLoading={isLoading} error={error} onRetry={refetch} rows={2}>
        <div
          ref={box}
          role="region"
          aria-label={tr("দানের মানচিত্র", "Donation map")}
          className="h-72 w-full bg-muted sm:h-96"
        />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <ol
            className="space-y-1.5 text-sm"
            aria-label={tr("সবচেয়ে সক্রিয় জেলা", "Most active districts")}
          >
            {top.map((h, i) => (
              <li key={h.district} className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-foreground">{num(i + 1)}</span>
                <BadgeCheck className="h-4 w-4 text-offer" aria-hidden />
                <span className="flex-1 font-medium">{h.district}</span>
                <span className="text-muted-foreground">
                  {num(h.donors)} {tr("জন", "donors")}
                </span>
              </li>
            ))}
          </ol>
          <ul className="space-y-1.5 text-sm">
            {recent.slice(0, 4).map((h) => (
              <li key={h.district} className="flex items-start gap-2">
                <span className="mt-0.5 text-offer" aria-hidden>
                  ✓
                </span>
                <span>
                  <b>{h.recent[0].name}</b>, {h.district} — {h.recent[0].item}{" "}
                  <span className="text-muted-foreground">
                    ({lang === "bn" ? h.recent[0].whenBn : h.recent[0].whenEn})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </QueryState>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1">
      <b className="text-foreground">{value}</b>{" "}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
