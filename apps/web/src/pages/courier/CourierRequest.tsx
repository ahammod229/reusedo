import { useT } from "@/features/feed/i18n";
import { Badge, Button, Card, cn } from "@/shared/components/ui";
import { CheckCircle2, Circle, Truck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";

type Step = "agree" | "requested" | "ready" | "picked_up" | "in_transit" | "delivered";
const STEPS: { id: Step; bn: string }[] = [
  { id: "agree", bn: "সম্মতি" },
  { id: "requested", bn: "অ্যাডমিন রিভিউ" },
  { id: "ready", bn: "কুরিয়ার প্রস্তুত" },
  { id: "picked_up", bn: "পিকআপ" },
  { id: "in_transit", bn: "পথে" },
  { id: "delivered", bn: "ডেলিভারি" },
];

// Demo state: in the real flow both flags come from the exchange record and
// the step comes from the shipment status written by the admin confirm action.
export function CourierRequest() {
  const t = useT();
  const giver = true; // demo: giver has already agreed
  const [receiver, setReceiver] = useState(false);
  const [sent, setSent] = useState(false);
  const both = giver && receiver;
  const current: Step = sent ? "requested" : "agree";
  const idx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
      <Helmet>
        <title>ReuseDo — {t("courierTitle")}</title>
      </Helmet>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/15 p-3 text-primary">
          <Truck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("courierTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("courierHint")}</p>
        </div>
      </div>

      <Card className="space-y-1 p-4">
        <div className="text-sm text-muted-foreground">জিনিস</div>
        <div className="font-semibold">ক্লাস ৮-এর সব বই (সেট)</div>
      </Card>

      <Card className="space-y-3 p-4">
        <Row label={t("giverAgree")} on={giver} />
        <Row
          label={t("receiverAgree")}
          on={receiver}
          action={!receiver ? () => setReceiver(true) : undefined}
          actionLabel={t("agreeCourier")}
        />
        <div className="grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">{t("pickup")}</div>মিরপুর ১০, ঢাকা
          </div>
          <div>
            <div className="text-muted-foreground">{t("dropoff")}</div>জিন্দাবাজার, সিলেট
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-warning-soft p-3 text-sm text-warning">
          <span>{t("charge")}</span>
          <span className="text-lg font-bold">৳১৩০</span>
        </div>
        <Button className="w-full" disabled={!both || sent} onClick={() => setSent(true)}>
          {sent ? "রিকোয়েস্ট পাঠানো হয়েছে ✓" : both ? t("sendToAdmin") : t("waitingBoth")}
        </Button>
      </Card>

      <Card className="p-4">
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={cn("flex items-center gap-3 text-sm", i > idx && "text-muted-foreground")}
            >
              {i <= idx ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
              {s.bn}
              {i === idx && <Badge variant="secondary">এখন</Badge>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Row({
  label,
  on,
  action,
  actionLabel,
}: { label: string; on: boolean; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2">
        {on ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
        {label}
      </span>
      {action && (
        <Button size="sm" variant="outline" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
