import type { FeedFilters, SortBy } from "@/features/data/types";
import { useSearchParams } from "react-router";
import type { Delivery, EduLevel, FeedPost } from "./types";

// Feed filters live in the URL so a filtered view can be shared or bookmarked
// ("/feed?kind=need&level=ssc&cat=books") and survives a refresh.

const one = <T extends string>(v: string | null, ok: readonly T[]): T | undefined =>
  v && (ok as readonly string[]).includes(v) ? (v as T) : undefined;

const LEVELS = ["primary", "junior", "ssc", "hsc", "admission", "university"] as const;
const CONDS = ["new", "good", "used"] as const;

export function parseFilters(p: URLSearchParams): FeedFilters {
  return {
    kind: one(p.get("kind"), ["offer", "need"] as const) ?? "all",
    category: p.get("cat") ?? "all",
    scope: one(p.get("scope"), ["area", "district", "country"] as const) ?? "country",
    q: p.get("q") ?? undefined,
    level: one<EduLevel>(p.get("level"), LEVELS) ?? "all",
    conditions: (p.get("cond") ?? "")
      .split(",")
      .filter((c): c is FeedPost["condition"] => (CONDS as readonly string[]).includes(c)),
    delivery: one<Delivery>(p.get("via"), ["pickup", "courier"] as const) ?? "any",
    within: one(p.get("within"), ["24h", "7d"] as const) ?? "any",
    verifiedOnly: p.get("verified") === "1",
    photoOnly: p.get("photo") === "1",
    urgentOnly: p.get("urgent") === "1",
    showGiven: p.get("given") === "1",
    sort: one<SortBy>(p.get("sort"), ["new", "urgent", "popular"] as const) ?? "near",
  };
}

export function toParams(f: FeedFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.kind !== "all") p.set("kind", f.kind);
  if (f.category !== "all") p.set("cat", f.category);
  if (f.scope !== "country") p.set("scope", f.scope);
  if (f.q) p.set("q", f.q);
  if (f.level && f.level !== "all") p.set("level", f.level);
  if (f.conditions?.length) p.set("cond", f.conditions.join(","));
  if (f.delivery && f.delivery !== "any") p.set("via", f.delivery);
  if (f.within && f.within !== "any") p.set("within", f.within);
  if (f.verifiedOnly) p.set("verified", "1");
  if (f.photoOnly) p.set("photo", "1");
  if (f.urgentOnly) p.set("urgent", "1");
  if (f.showGiven) p.set("given", "1");
  if (f.sort && f.sort !== "near") p.set("sort", f.sort);
  return p;
}

export const RESET_ADVANCED: Partial<FeedFilters> = {
  level: "all",
  conditions: [],
  delivery: "any",
  within: "any",
  verifiedOnly: false,
  photoOnly: false,
  urgentOnly: false,
  showGiven: false,
  sort: "near",
};

export function useFeedParams() {
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const update = (patch: Partial<FeedFilters>) =>
    setParams(toParams({ ...filters, ...patch }), { replace: true });
  return { filters, update };
}
