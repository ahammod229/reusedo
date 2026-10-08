import { useTr } from "@/features/feed/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createBdMap } from "./baseMap";
import { type LatLng, coarse, inBangladesh } from "./places";

/** Tap the map to mark your area. The result is rounded to ~100 m before it's kept. */
export default function LocationPicker({
  open,
  onOpenChange,
  start,
  value,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Where to centre first, e.g. the chosen district. */
  start?: LatLng | null;
  /** An already-chosen pin to show and adjust. */
  value?: LatLng | null;
  onPick: (at: LatLng) => void;
}) {
  const tr = useTr();
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [at, setAt] = useState<LatLng | null>(null);
  const [outside, setOutside] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const pin = useRef<L.Marker | null>(null);

  // The dialog mounts its content late; build the map once the box exists.
  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild only when opened, not on every render
  useEffect(() => {
    if (!open || !box) return;
    const { map } = createBdMap(box);
    mapRef.current = map;
    const icon = L.divIcon({
      className: "",
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      html: '<div class="rd-drop"></div>',
    });
    const place = (p: LatLng) => {
      if (!inBangladesh(p)) {
        setOutside(true);
        return;
      }
      setOutside(false);
      setAt(p);
      if (pin.current) pin.current.setLatLng(p);
      else {
        pin.current = L.marker(p, {
          icon,
          draggable: true,
          keyboard: true,
          title: tr("আপনার এলাকা", "Your area"),
        })
          .on("dragend", (e) => {
            const ll = (e.target as L.Marker).getLatLng();
            place([ll.lat, ll.lng]);
          })
          .addTo(map);
      }
    };
    map.on("click", (e) => place([e.latlng.lat, e.latlng.lng]));
    if (value) {
      map.setView(value, 14);
      place(value);
    } else if (start) map.setView(start, 12);
    // Leaflet measures the box before the dialog's open animation ends.
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      pin.current = null;
      setAt(null);
    };
  }, [open, box]);

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const p: LatLng = [pos.coords.latitude, pos.coords.longitude];
        mapRef.current?.flyTo(p, 14, { duration: 0.6 });
        mapRef.current?.fire("click", { latlng: L.latLng(p[0], p[1]) });
      },
      () => setOutside(false),
      { timeout: 8000 },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] gap-3 overflow-hidden rounded-3xl p-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{tr("ম্যাপে আপনার এলাকা দেখান", "Mark your area on the map")}</DialogTitle>
          <DialogDescription>
            {tr(
              "ম্যাপে চাপ দিন বা পিন টেনে সরান। কাছাকাছি হলেই চলবে — আমরা ১০০ মিটারের মধ্যে গোল করে রাখি, কেউ আপনার বাড়ি দেখবে না।",
              "Tap the map or drag the pin. Close is enough — we round it to ~100 m and nobody sees your home.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="relative isolate overflow-hidden rounded-2xl border">
          <div ref={setBox} className="rd-map h-[min(60vh,440px)] w-full" />
          <button
            type="button"
            onClick={locate}
            className="absolute right-3 top-3 z-[500] flex h-10 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold text-primary shadow-md hover:bg-accent"
          >
            <LocateFixed className="h-4 w-4" /> {tr("আমার অবস্থান", "My location")}
          </button>
        </div>
        {outside && (
          <p className="text-sm font-medium text-destructive">
            {tr("বাংলাদেশের ভেতরে একটা জায়গা বাছুন", "Pick a place inside Bangladesh")}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            {tr("বাতিল", "Cancel")}
          </Button>
          <Button
            className="flex-1"
            disabled={!at}
            onClick={() => {
              if (at) onPick(coarse(at));
              onOpenChange(false);
            }}
          >
            {at ? tr("এই জায়গা", "Use this place") : tr("ম্যাপে চাপ দিন", "Tap the map")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
