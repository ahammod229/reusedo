import { trackAd, useAdConfig } from "@/features/data/hooks";
import type { AdPlacement } from "@/features/data/platformStore";
import { safeAdUrl } from "@/features/data/platformStore";
import type { PublicAd } from "@/features/data/types";
import { Card } from "@/shared/components/ui";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { useT } from "./i18n";

// One ad slot. Direct ads come from the admin Ads manager; when Google Ad
// Manager is configured the GPT tag renders into the `data-ad-unit` container.
// `slot` is the ordinal of this slot on the page, used for rotation.
export function AdCard({
  placement,
  slot,
  ctx,
}: {
  placement: AdPlacement;
  slot: number;
  ctx?: { district?: string; category?: string };
}) {
  const { data: cfg } = useAdConfig(placement, ctx);
  if (!cfg?.enabled) return null;

  const direct = cfg.ads.length ? cfg.ads[slot % cfg.ads.length] : null;
  const useAdx =
    !!cfg.adx &&
    (!direct || cfg.priority === "adx_first" || (cfg.priority === "mix" && slot % 2 === 1));

  if (useAdx && cfg.adx)
    return <AdxSlot unit={cfg.adx.unit} networkCode={cfg.adx.networkCode} slot={slot} />;
  if (direct) return <DirectAd ad={direct} />;
  return null;
}

function DirectAd({ ad }: { ad: PublicAd }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const url = safeAdUrl(ad.url);

  // Count an impression once, when at least half the card has been on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          trackAd(ad.id, "impression");
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad.id]);

  if (!url) return null;
  return (
    <Card ref={ref} className="overflow-hidden" aria-label={t("sponsored")} data-ad-id={ad.id}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">{t("sponsored")}</span>
        <span className="truncate">{ad.advertiser}</span>
      </div>
      {ad.image && (
        <img
          src={ad.image}
          alt=""
          loading="lazy"
          className="mt-3 aspect-[16/9] w-full bg-muted object-cover"
        />
      )}
      <div className="p-4 pt-3">
        <h3 className="font-semibold leading-snug">{ad.headline}</h3>
        {ad.body && <p className="mt-1 text-sm text-muted-foreground">{ad.body}</p>}
        <a
          href={url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackAd(ad.id, "click")}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:bg-accent"
        >
          {ad.cta} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </Card>
  );
}

function AdxSlot({ unit, networkCode, slot }: { unit: string; networkCode: string; slot: number }) {
  const t = useT();
  // The GPT loader (googletag.defineSlot(`/${networkCode}${unit}`, 'fluid', id)) is added
  // when the network code is live; the reserved height prevents layout shift.
  return (
    <Card
      className="flex min-h-40 items-center justify-center border-dashed bg-muted/40 text-xs text-muted-foreground"
      aria-label={t("sponsored")}
      data-ad-unit={`/${networkCode}${unit}`}
      id={`gpt-${unit.replace(/\W/g, "")}-${slot}`}
    >
      {t("sponsored")} · Google Ad Manager
    </Card>
  );
}
