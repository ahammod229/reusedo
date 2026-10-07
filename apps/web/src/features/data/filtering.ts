import type { FeedPost } from "@/features/feed/types";
import type { FeedFilters } from "./types";

// One definition of "does this post match", shared by the mock feed and by
// saved-search alerts. The API applies the same rules in SQL.

const URGENCY_RANK = { urgent: 0, soon: 1, anytime: 2 } as const;

export function matchesFilters(p: FeedPost, f: FeedFilters, myDistrict = "ঢাকা") {
  const q = f.q?.trim().toLowerCase();
  if (f.kind !== "all" && p.kind !== f.kind) return false;
  if (f.category !== "all" && p.category !== f.category) return false;
  if (q && !`${p.title} ${p.description} ${p.edu?.detail ?? ""}`.toLowerCase().includes(q))
    return false;
  if (f.scope === "area" && p.distanceKm > 5) return false;
  if (f.scope === "district" && p.district !== myDistrict) return false;
  if (f.level && f.level !== "all" && p.edu?.level !== f.level) return false;
  if (f.conditions?.length && !f.conditions.includes(p.condition)) return false;
  if (f.delivery && f.delivery !== "any" && !p.delivery.includes(f.delivery)) return false;
  if (f.within === "24h" && p.hoursAgo > 24) return false;
  if (f.within === "7d" && p.hoursAgo > 24 * 7) return false;
  if (f.verifiedOnly && !p.author.verified) return false;
  if (f.photoOnly && p.images.length === 0) return false;
  if (f.urgentOnly && p.urgency !== "urgent") return false;
  if (!f.showGiven && p.status === "given") return false;
  return true;
}

export function sortPosts(list: FeedPost[], sort: FeedFilters["sort"] = "near") {
  const out = [...list];
  const given = (p: FeedPost) => (p.status === "available" ? 0 : 1); // available first
  out.sort((a, b) => {
    const g = given(a) - given(b);
    if (g) return g;
    switch (sort) {
      case "new":
        return a.hoursAgo - b.hoursAgo;
      case "urgent":
        return (
          URGENCY_RANK[a.urgency ?? "anytime"] - URGENCY_RANK[b.urgency ?? "anytime"] ||
          a.distanceKm - b.distanceKm
        );
      case "popular":
        return b.requests - a.requests;
      default:
        return a.distanceKm - b.distanceKm;
    }
  });
  return out;
}

/** Advanced filters only (not kind/category/scope/q), for the "Filters (3)" badge. */
export function advancedCount(f: FeedFilters) {
  return [
    f.level && f.level !== "all",
    !!f.conditions?.length,
    f.delivery && f.delivery !== "any",
    f.within && f.within !== "any",
    f.verifiedOnly,
    f.photoOnly,
    f.urgentOnly,
    f.showGiven,
    f.sort && f.sort !== "near",
  ].filter(Boolean).length;
}
