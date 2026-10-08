// Approximate centre points for areas and districts. Posts are drawn at their
// AREA centre — never at anyone's address (docs/STUDENT_UX.md §3). With the API
// these come from the post's saved area (geocoded once via the Maps integration).

export type LatLng = [number, number];

/** Bangladesh, with a little padding so edge districts aren't clipped. */
export const BD_BOUNDS: [LatLng, LatLng] = [
  [20.45, 87.9],
  [26.75, 92.75],
];
export const BD_CENTER: LatLng = [23.69, 90.35];

export const DISTRICT_CENTERS: Record<string, LatLng> = {
  ঢাকা: [23.8103, 90.4125],
  চট্টগ্রাম: [22.3569, 91.7832],
  সিলেট: [24.8949, 91.8687],
  রাজশাহী: [24.3745, 88.6042],
  খুলনা: [22.8456, 89.5403],
  বরিশাল: [22.701, 90.3535],
  রংপুর: [25.7439, 89.2752],
  ময়মনসিংহ: [24.7471, 90.4203],
  কুমিল্লা: [23.4607, 91.1809],
  গাজীপুর: [23.9999, 90.4203],
  নারায়ণগঞ্জ: [23.6238, 90.5],
  বগুড়া: [24.8465, 89.3773],
  যশোর: [23.1664, 89.2081],
  কক্সবাজার: [21.4272, 92.0058],
};

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
