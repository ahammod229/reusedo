// Approximate centre points for areas and districts. Posts are drawn at their
// AREA centre — never at anyone's address (docs/STUDENT_UX.md §3). With the API
// these come from the post's saved area (geocoded once via the Maps integration).

import { DISTRICT_COORDS } from "./districts";

export type LatLng = [number, number];

/** Bangladesh, with a little padding so edge districts aren't clipped. */
export const BD_BOUNDS: [LatLng, LatLng] = [
  [20.45, 87.9],
  [26.75, 92.75],
];
export const BD_CENTER: LatLng = [23.69, 90.35];

/** All 64 district centres (features/geo/districts.ts). */
export const DISTRICT_CENTERS: Record<string, LatLng> = DISTRICT_COORDS;

const AREA_CENTERS: Record<string, LatLng> = {
  "মিরপুর ১": [23.7956, 90.3537],
  "মিরপুর ২": [23.805, 90.363],
  "মিরপুর ১০": [23.8069, 90.3687],
  "মিরপুর ১১": [23.8183, 90.3667],
  পল্লবী: [23.824, 90.364],
  কাজীপাড়া: [23.7975, 90.373],
  কল্যাণপুর: [23.781, 90.36],
  মোহাম্মদপুর: [23.766, 90.358],
  "ধানমন্ডি ১৫": [23.7445, 90.372],
  শাহবাগ: [23.738, 90.395],
  বনানী: [23.794, 90.404],
  "উত্তরা সেক্টর ৪": [23.865, 90.4],
  আগ্রাবাদ: [22.326, 91.812],
  খুলশী: [22.36, 91.811],
  জিন্দাবাজার: [24.896, 91.868],
};

/** Area centre if known, else the district centre, else null (not shown on the map). */
export function placeOf(area: string, district: string): LatLng | null {
  return AREA_CENTERS[area] ?? DISTRICT_CENTERS[district] ?? null;
}

/** Rounds a picked pin to ~100 m so a stored location is never a doorstep. */
export const coarse = ([lat, lng]: LatLng): LatLng => [
  Math.round(lat * 1000) / 1000,
  Math.round(lng * 1000) / 1000,
];

export const inBangladesh = ([lat, lng]: LatLng) =>
  lat >= BD_BOUNDS[0][0] &&
  lat <= BD_BOUNDS[1][0] &&
  lng >= BD_BOUNDS[0][1] &&
  lng <= BD_BOUNDS[1][1];
