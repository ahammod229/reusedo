import { Card } from "@/shared/components/ui";
import { MOCK_ADS } from "./mock";
import { useT } from "./i18n";

// Native in-feed ad slot. When VITE_ADMANAGER_NETWORK_CODE is set, the Google
// Ad Manager (GPT) tag should render into this container; until then a
// labelled placeholder keeps the layout identical.
export function AdCard({ index }: { index: number }) {
  const t = useT();
  const ad = MOCK_ADS[index % MOCK_ADS.length];
  return (
    <Card
      className="overflow-hidden border-dashed bg-muted/40"
      data-ad-slot={`feed-${index}`}
      aria-label={t("sponsored")}
    >
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
        <span className="rounded bg-background px-1.5 py-0.5 font-medium">{t("sponsored")}</span>
        <span>{ad.brand}</span>
      </div>
      <div className="p-4 pt-2">
        <h3 className="font-semibold">{ad.headline}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{ad.body}</p>
        <button
          type="button"
          className="mt-3 rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:bg-accent"
        >
          {ad.cta}
        </button>
      </div>
    </Card>
  );
}
