import { PostTags } from "@/features/feed/PostBits";
import { useLang, useNum, useTr } from "@/features/feed/i18n";
import { type FeedPost, categoryOf } from "@/features/feed/types";
import { cn } from "@/shared/components/ui";
import L from "leaflet";
import { LocateFixed, Maximize2, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { MAX_ZOOM, createBdMap } from "./baseMap";
import { clusterByPixels } from "./cluster";
import { DISTRICT_CENTERS, type LatLng, inBangladesh, placeOf } from "./places";

/** Below this zoom we show one bubble per district; above it, one pin per area. */
const AREA_ZOOM = 10;

interface Group {
  key: string;
  label: string;
  at: LatLng;
  posts: FeedPost[];
}

function groupBy(posts: FeedPost[], by: "area" | "district"): Group[] {
  const m = new Map<string, Group>();
  for (const p of posts) {
    const at =
      by === "area"
        ? placeOf(p.area, p.district)
        : (DISTRICT_CENTERS[p.district] ?? placeOf(p.area, p.district));
    if (!at) continue;
    const key = by === "area" ? `${p.area}|${p.district}` : p.district;
    const g = m.get(key) ?? {
      key,
      label: by === "area" ? `${p.area}, ${p.district}` : p.district,
      at,
      posts: [],
    };
    g.posts.push(p);
    m.set(key, g);
  }
  return [...m.values()];
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export default function PostMap({ posts, className }: { posts: FeedPost[]; className?: string }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof createBdMap> | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [zoom, setZoom] = useState(0);
  // Area keys in the open panel (one area, or a merged cluster at max zoom).
  const [selected, setSelected] = useState<string[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const byArea = useMemo(() => groupBy(posts, "area"), [posts]);
  const byDistrict = useMemo(() => groupBy(posts, "district"), [posts]);
  const placed = byArea.reduce((n, g) => n + g.posts.length, 0);
  const offers = posts.filter((p) => p.kind === "offer").length;
  const needs = posts.length - offers;
  const selGroups = selected ? byArea.filter((g) => selected.includes(g.key)) : [];
  const sel = selGroups.length
    ? {
        label:
          selGroups.length === 1
            ? selGroups[0].label
            : tr(`${num(selGroups.length)}টি এলাকা`, `${selGroups.length} areas`),
        posts: selGroups.flatMap((g) => g.posts),
      }
    : null;

  // Create the map once.
  useEffect(() => {
    if (!box.current) return;
    const a = createBdMap(box.current);
    api.current = a;
    layer.current = L.layerGroup().addTo(a.map);
    setZoom(a.map.getZoom());
    a.map.on("zoomend", () => setZoom(a.map.getZoom()));
    a.map.on("click", () => setSelected(null));
    return () => {
      a.destroy();
      api.current = null;
    };
  }, []);

  // Draw district bubbles or area pins for the current zoom.
  useEffect(() => {
    const map = api.current?.map;
    const lg = layer.current;
    if (!map || !lg) return;
    lg.clearLayers();
    if (zoom < AREA_ZOOM) {
      for (const g of byDistrict) {
        const size = Math.round(40 + Math.min(32, Math.sqrt(g.posts.length) * 9));
        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          html: `<div class="rd-bubble" style="width:${size}px;height:${size}px">${num(g.posts.length)}<small>${esc(g.label)}</small></div>`,
        });
        L.marker(g.at, { icon, keyboard: true, title: `${g.label}: ${g.posts.length}` })
          .on("click", () => map.flyTo(g.at, AREA_ZOOM + 2, { duration: 0.7 }))
          .addTo(lg);
      }
    } else {
      for (const c of clusterByPixels(byArea, map, 54, (g) => g.posts.length)) {
        const groups = c.items;
        const all = groups.flatMap((g) => g.posts);
        const hasOffer = all.some((p) => p.kind === "offer");
        const hasNeed = all.some((p) => p.kind === "need");
        const ring =
          hasOffer && hasNeed ? "var(--primary)" : hasNeed ? "var(--need)" : "var(--offer)";
        const top = [...all].sort((a, b) => b.requests - a.requests)[0];
        const keys = groups.map((g) => g.key);
        const active = !!selected && keys.every((k) => selected.includes(k));
        const size = all.length > 1 ? 46 : 40;
        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          html: `<div class="rd-pin${active ? " is-active" : ""}" style="--rd-ring:${ring};width:${size}px;height:${size}px">${categoryOf(top.category).emoji}${
            all.length > 1 ? `<span class="rd-pin__count">${num(all.length)}</span>` : ""
          }</div>`,
        });
        const title = groups.map((g) => g.label).join(" · ");
        L.marker(c.at, { icon, keyboard: true, title })
          .on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            // Several areas overlap: zoom in to separate them while we still can.
            if (groups.length > 1 && map.getZoom() < MAX_ZOOM - 0.5) {
              map.flyToBounds(L.latLngBounds(groups.map((g) => g.at)), {
                padding: [90, 90],
                maxZoom: MAX_ZOOM,
                duration: 0.6,
              });
              return;
            }
            setSelected(keys);
            map.panTo(c.at, { animate: true });
          })
          .addTo(lg);
      }
    }
  }, [zoom, byArea, byDistrict, selected, num]);

  const locate = () => {
    const map = api.current?.map;
    if (!map) return;
    const fallback = () => {
      // Demo user's district; with the API, the user's saved area centre.
      map.flyTo(DISTRICT_CENTERS.ঢাকা, 12, { duration: 0.8 });
      setNote(tr("আপনার এলাকা দেখানো হচ্ছে", "Showing your area"));
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at: LatLng = [pos.coords.latitude, pos.coords.longitude];
        if (inBangladesh(at)) map.flyTo(at, 13, { duration: 0.8 });
        else fallback();
      },
      fallback,
      { timeout: 6000, maximumAge: 600000 },
    );
  };

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2500);
    return () => clearTimeout(t);
  }, [note]);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border bg-card shadow-sm",
        className,
      )}
    >
      <div
        ref={box}
        className="rd-map h-full w-full"
        role="region"
        aria-label={tr("পোস্টের ম্যাপ", "Map of posts")}
      />

      {/* Legend */}
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-col gap-1.5">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border bg-card/95 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-[3px] ring-offer" /> {tr("দেওয়া", "Offers")}{" "}
            {num(offers)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-[3px] ring-need" /> {tr("দরকার", "Needs")}{" "}
            {num(needs)}
          </span>
        </div>
        {zoom < AREA_ZOOM && posts.length > 0 && (
          <p className="rounded-xl bg-card/95 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
            {tr("জেলায় চাপ দিন — এলাকা দেখাবে", "Tap a district to see areas")}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            api.current?.fitCountry();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card shadow-md hover:bg-accent"
          aria-label={tr("পুরো দেশ দেখুন", "Show whole country")}
          title={tr("পুরো দেশ", "Whole country")}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={locate}
          className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-primary shadow-md hover:bg-accent"
          aria-label={tr("আমার কাছে", "Near me")}
          title={tr("আমার কাছে", "Near me")}
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {note && (
        <output className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-md">
          {note}
        </output>
      )}

      {/* Selected area */}
      {sel ? (
        <section
          className="absolute inset-x-3 bottom-3 z-[600] max-h-[55%] overflow-hidden rounded-2xl border bg-card shadow-xl sm:left-auto sm:right-16 sm:w-96"
          aria-label={sel.label}
        >
          <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate font-bold">{sel.label}</p>
              <p className="text-xs text-muted-foreground">
                {tr(`${num(sel.posts.length)}টি পোস্ট`, `${sel.posts.length} posts`)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent"
              aria-label={tr("বন্ধ করুন", "Close")}
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <ul className="max-h-[calc(55vh-4rem)] divide-y overflow-y-auto">
            {sel.posts.map((p) => {
              const cat = categoryOf(p.category);
              return (
                <li key={p.id}>
                  <Link
                    to={`/post/${p.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl",
                        p.kind === "offer" ? "bg-offer-soft" : "bg-need-soft",
                      )}
                    >
                      {cat.emoji}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                            p.kind === "offer"
                              ? "bg-offer-soft text-offer"
                              : "bg-need-soft text-need",
                          )}
                        >
                          {p.kind === "offer" ? tr("দেওয়া", "Offer") : tr("দরকার", "Need")}
                        </span>
                        <span className="line-clamp-1 text-sm font-semibold">{p.title}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.author.name} · {p.postedAt}
                      </span>
                      <PostTags post={p} compact />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-3 z-[500] flex max-w-[calc(100%-5rem)] items-center gap-1.5 rounded-xl bg-card/95 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
          {placed < posts.length
            ? tr(
                `শুধু এলাকা দেখানো হয়, ঠিকানা নয় · ${num(posts.length - placed)}টির এলাকা ম্যাপে নেই`,
                `Areas only, never addresses · ${posts.length - placed} not on the map`,
              )
            : tr("শুধু এলাকা দেখানো হয়, কারও ঠিকানা নয়", "Only areas are shown, never addresses")}
        </p>
      )}
      {posts.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
          <p className="rounded-2xl bg-card/95 px-4 py-3 text-sm font-medium shadow-md">
            {lang === "bn" ? "এই ফিল্টারে কোনো পোস্ট নেই" : "No posts for these filters"}
          </p>
        </div>
      )}
    </div>
  );
}
