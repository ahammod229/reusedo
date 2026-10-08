import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css";
import { BD_OUTLINE } from "./bdOutline";
import { BD_BOUNDS } from "./places";

// One place that decides how every ReuseDo map looks and behaves.
// Tiles: OpenStreetMap by default (fine for development and light use). For
// production set VITE_MAP_TILE_URL to a provider you have a key for — e.g.
// Barikoi or MapTiler (see BUILD_GUIDE §5) — OSM's free servers aren't meant
// for an app's full traffic.
const TILE_URL =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined) ??
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  (import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined) ??
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/** Area-level only: deeper zoom would suggest more precision than we store. */
export const MAX_ZOOM = 15;

export function createBdMap(el: HTMLElement, opts: { interactive?: boolean } = {}) {
  // Fit to the real border (tighter than BD_BOUNDS) so the country fills the box.
  const bounds = L.latLngBounds(BD_OUTLINE.flat());
  const limit = L.latLngBounds(BD_BOUNDS);
  const map = L.map(el, {
    zoomControl: false,
    attributionControl: true,
    maxBounds: limit.pad(0.12),
    maxBoundsViscosity: 1, // can't drag the country out of view
    maxZoom: MAX_ZOOM,
    zoomSnap: 0.25,
    scrollWheelZoom: opts.interactive !== false ? "center" : false,
    tapHold: false,
  });
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: MAX_ZOOM, detectRetina: true }).addTo(
    map,
  );
  map.attributionControl.setPrefix(false);

  // Frame the country: dim everything outside Bangladesh, draw its border on top.
  const world: L.LatLngTuple[] = [
    [5, 75],
    [40, 75],
    [40, 105],
    [5, 105],
  ];
  L.polygon([world, ...BD_OUTLINE], {
    className: "rd-mask",
    interactive: false,
    stroke: false,
  }).addTo(map);
  L.polygon(BD_OUTLINE, { className: "rd-outline", interactive: false, fill: false }).addTo(map);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // Whole country fills the box on any screen; never zoom out past that.
  const fit = () => {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [24, 24] });
    map.setMinZoom(map.getBoundsZoom(bounds, false, L.point(24, 24)) - 0.25);
  };
  fit();
  return {
    map,
    fitCountry: () => map.flyToBounds(bounds, { padding: [24, 24], duration: 0.6 }),
    refit: fit,
  };
}
