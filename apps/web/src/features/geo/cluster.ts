import type L from "leaflet";
import type { LatLng } from "./places";

/**
 * Greedy screen-space clustering: items closer than `radius` pixels at the
 * current zoom merge into one marker, placed at their weighted centre.
 * Re-run on every zoom change so markers never sit on top of each other.
 */
export function clusterByPixels<T extends { at: LatLng }>(
  items: T[],
  map: L.Map,
  radius: number,
  weight: (t: T) => number,
) {
  const out: { items: T[]; at: LatLng; px: L.Point; weight: number }[] = [];
  for (const it of [...items].sort((a, b) => weight(b) - weight(a))) {
    const px = map.project(it.at);
    const hit = out.find((c) => c.px.distanceTo(px) < radius);
    if (!hit) {
      out.push({ items: [it], at: it.at, px, weight: weight(it) });
      continue;
    }
    hit.items.push(it);
    hit.weight += weight(it);
    const w = hit.items.reduce((n, x) => n + weight(x), 0) || 1;
    hit.at = [
      hit.items.reduce((n, x) => n + x.at[0] * weight(x), 0) / w,
      hit.items.reduce((n, x) => n + x.at[1] * weight(x), 0) / w,
    ];
    hit.px = map.project(hit.at);
  }
  return out;
}
