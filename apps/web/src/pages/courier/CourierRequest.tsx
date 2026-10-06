import { useCheckoutConfig, useSubmitCourierPayment } from "@/features/data/hooks";
import type { PaymentMethod } from "@/features/data/platformStore";
import { useT, useTr } from "@/features/feed/i18n";
import { isBdMobile } from "@/features/geo/bd";
import { Field } from "@/pages/auth/components/Field";
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
  const tr = useTr();
  const giver = true; // demo: giver has already agreed
  const [receiver, setReceiver] = useState(false);
  const [sent, setSent] = useState(false);
  const { data: checkout } = useCheckoutConfig();
  const pay = useSubmitCourierPayment();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [trx, setTrx] = useState("");
  const [sender, setSender] = useState("");
  const methods = (["cod", "bkash", "nagad"] as const).filter((m) => checkout?.methods[m]);
  const chosen = method ?? methods[0] ?? null;
  const wallet = chosen === "bkash" || chosen === "nagad";
  const trxOk = /^[A-Z0-9]{8,12}$/.test(trx);
  const payOk = !!chosen && (!wallet || (trxOk && isBdMobile(sender)));
  const send = () => {
    if (!chosen) return;
    pay.mutate(
      {
        courierId: "c1",
        item: "ক্লাস ৮-এর সব বই (সেট)",
        payer: "ফাহিম রহমান",
        phone: "01811-000002",
        amount: 130,
        method: chosen,
        ...(wallet ? { trxId: trx, senderNumber: sender } : {}),
      },
      { onSuccess: () => setSent(true) },
    );
  };
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
        {both && !sent && chosen && (
          <fieldset className="space-y-2 border-t pt-3">
            <legend className="text-sm font-semibold">
              {tr("কীভাবে চার্জ দেবেন", "How you'll pay")}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={chosen === m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-xl border p-2.5 text-sm font-semibold",
                    chosen === m ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                  )}
                >
                  {m === "cod" ? tr("ডেলিভারিতে", "On delivery") : m === "bkash" ? "bKash" : "Nagad"}
                </button>
              ))}
            </div>
            {wallet && (
              <div className="space-y-3 rounded-xl bg-muted p-3 text-sm">
                <p>
                  {tr("এই নম্বরে ৳১৩০ পাঠান", "Send ৳130 to")}{" "}
                  <b className="font-mono">
                    {chosen === "bkash" ? checkout?.bkashNumber : checkout?.nagadNumber}
                  </b>
                  {tr(
                    ", তারপর নিচে তথ্য দিন। অ্যাডমিন মিলিয়ে দেখে গ্রহণ করবেন।",
                    ", then fill in below. An admin verifies it.",
                  )}
                </p>
                <Field
                  label={tr("যে নম্বর থেকে পাঠিয়েছেন", "Number you sent from")}
                  inputMode="tel"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  error={
                    sender.length > 5 && !isBdMobile(sender)
                      ? tr("সঠিক নম্বর দিন", "Enter a valid number")
                      : undefined
                  }
                />
                <Field
                  label="TrxID"
                  value={trx}
                  maxLength={12}
                  spellCheck={false}
                  autoCapitalize="characters"
                  onChange={(e) => setTrx(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  hint={tr("SMS-এ পাওয়া ৮–১২ অক্ষরের কোড", "The 8–12 character code from the SMS")}
                  error={
                    trx.length >= 8 && !trxOk
                      ? tr("শুধু ইংরেজি অক্ষর ও সংখ্যা", "Letters and digits only")
                      : undefined
                  }
                />
              </div>
            )}
          </fieldset>
        )}
        <Button
          className="w-full"
          disabled={!both || sent || !payOk || pay.isPending}
          onClick={send}
        >
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
