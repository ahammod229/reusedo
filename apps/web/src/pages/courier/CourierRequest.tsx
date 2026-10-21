import { useProfile } from "@/features/auth";
import {
  useAgreeCourier,
  useCourier,
  useExchanges,
  useRequestCourier,
} from "@/features/data/hooks";
import type { PaymentMethod } from "@/features/data/platformStore";
import type { CourierAddress, CourierView } from "@/features/data/types";
import { useNum, useT, useTr } from "@/features/feed/i18n";
import { BD_DIVISIONS, isBdMobile, normalizePhone } from "@/features/geo/bd";
import { ErrorBanner, Field, SelectField } from "@/pages/auth/components/Field";
import { Badge, Button, Card, cn } from "@/shared/components/ui";
import { CheckCircle2, Circle, Truck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router";

type Step = "agree" | "requested" | "ready" | "picked_up" | "in_transit" | "delivered";
const STEPS: { id: Step; bn: string; en: string }[] = [
  { id: "agree", bn: "সম্মতি", en: "Both agree" },
  { id: "requested", bn: "অ্যাডমিন রিভিউ", en: "Admin review" },
  { id: "ready", bn: "কুরিয়ার প্রস্তুত", en: "Courier ready" },
  { id: "picked_up", bn: "পিকআপ", en: "Picked up" },
  { id: "in_transit", bn: "পথে", en: "On the way" },
  { id: "delivered", bn: "ডেলিভারি", en: "Delivered" },
];

const ALL_DISTRICTS = BD_DIVISIONS.flatMap((d) => d.districts);

function currentStep(v: CourierView): Step {
  const r = v.request;
  if (!r || r.status === "rejected")
    return v.giverAgreed && v.receiverAgreed && r ? "requested" : "agree";
  if (r.status === "pending") return "requested";
  if (r.delivery === "delivered") return "delivered";
  if (r.delivery === "in_transit") return "in_transit";
  if (r.delivery === "picked_up") return "picked_up";
  return "ready";
}

/** Courier for one exchange (`?exchange=`), or a list of my courier exchanges. */
export function CourierRequest() {
  const t = useT();
  const [params] = useSearchParams();
  const exchangeId = params.get("exchange");
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
      {exchangeId ? <CourierFor exchangeId={exchangeId} /> : <CourierList />}
    </div>
  );
}

function CourierList() {
  const tr = useTr();
  const { data = [], isLoading } = useExchanges();
  const list = data.filter((e) => e.via === "courier" && e.status !== "cancelled");
  if (isLoading) return <Card className="h-24 animate-pulse p-4" />;
  if (list.length === 0) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        {tr(
          "এখনো কোনো কুরিয়ার লেনদেন নেই। পোস্টে রিকোয়েস্ট করার সময় “কুরিয়ার” বাছলে এখানে দেখাবে।",
          "No courier exchanges yet. Choose “Courier” when you request an item and it shows here.",
        )}
      </Card>
    );
  }
  return (
    <ul className="space-y-2">
      {list.map((e) => (
        <li key={e.id}>
          <Link
            to={`/courier?exchange=${e.id}`}
            className="flex items-center justify-between rounded-2xl border bg-card p-4 hover:bg-accent"
          >
            <span className="font-semibold">{e.title}</span>
            <span className="text-sm text-muted-foreground">{e.other}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CourierFor({ exchangeId }: { exchangeId: string }) {
  const t = useT();
  const tr = useTr();
  const num = useNum();
  const { data: v, isLoading, error, refetch } = useCourier(exchangeId);

  if (isLoading) return <Card className="h-40 animate-pulse p-4" />;
  if (error || !v) {
    return (
      <Card className="space-y-3 p-4">
        <p className="text-sm">
          {tr("কুরিয়ারের তথ্য আনা যায়নি।", "Couldn't load the courier details.")}
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          {tr("আবার চেষ্টা", "Try again")}
        </Button>
      </Card>
    );
  }

  const step = currentStep(v);
  const idx = STEPS.findIndex((s) => s.id === step);
  const iAgreed = v.role === "giver" ? v.giverAgreed : v.receiverAgreed;

  return (
    <>
      <Card className="space-y-1 p-4">
        <div className="text-sm text-muted-foreground">{tr("জিনিস", "Item")}</div>
        <div className="font-semibold">{v.item}</div>
      </Card>

      <Card className="space-y-3 p-4">
        <Row label={t("giverAgree")} on={v.giverAgreed} />
        <Row label={t("receiverAgree")} on={v.receiverAgreed} />
        <div className="grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">{t("pickup")}</div>
            {v.pickupArea ?? "—"}
          </div>
          <div>
            <div className="text-muted-foreground">{t("dropoff")}</div>
            {v.dropoffArea ?? "—"}
          </div>
        </div>
        {v.charge !== null && (
          <div className="flex items-center justify-between rounded-lg bg-warning-soft p-3 text-sm text-warning">
            <span>
              {t("charge")}
              {v.weightKg ? ` · ${num(v.weightKg)} ${tr("কেজি", "kg")}` : ""}
            </span>
            <span className="text-lg font-bold">৳{num(v.request?.charge ?? v.charge)}</span>
          </div>
        )}
        {v.request?.status === "rejected" && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {tr(
              "অ্যাডমিন এই কুরিয়ার রিকোয়েস্ট বাতিল করেছেন।",
              "An admin turned this courier request down.",
            )}
          </p>
        )}
        {v.request?.tracking && (
          <p className="text-sm">
            {tr("ট্র্যাকিং", "Tracking")}: <b className="font-mono">{v.request.tracking}</b>
          </p>
        )}

        {!iAgreed && <AgreeForm v={v} />}
        {iAgreed && !v.request && v.role === "receiver" && v.giverAgreed && <PayForm v={v} />}
        {iAgreed && !v.request && !(v.role === "receiver" && v.giverAgreed) && (
          <p className="text-sm text-muted-foreground">{t("waitingBoth")}</p>
        )}
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
              {tr(s.bn, s.en)}
              {i === idx && <Badge variant="secondary">{tr("এখন", "Now")}</Badge>}
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function AgreeForm({ v }: { v: CourierView }) {
  const t = useT();
  const tr = useTr();
  const { data: me } = useProfile();
  const agree = useAgreeCourier(v.exchangeId);
  const giver = v.role === "giver";
  const [a, setA] = useState<CourierAddress>({
    name: me?.name ?? "",
    phone: me?.phone ?? "",
    district: me?.district ?? "",
    upazila: me?.upazila ?? "",
    area: me?.area ?? "",
    line: "",
  });
  const [weight, setWeight] = useState("1");
  const [touched, setTouched] = useState(false);
  const kg = Number.parseFloat(weight);
  const errors = {
    name: a.name.trim().length < 2,
    phone: !isBdMobile(a.phone),
    district: !a.district,
    upazila: a.upazila.trim().length < 2,
    area: a.area.trim().length < 2,
    line: a.line.trim().length < 6,
    weight: giver && !(kg > 0 && kg <= 30),
  };
  const ok = !Object.values(errors).some(Boolean);
  const req = tr("দরকার", "Required");
  const set = (k: keyof CourierAddress) => (e: { target: { value: string } }) =>
    setA((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form
      className="space-y-3 border-t pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!ok) return;
        agree.mutate({
          address: { ...a, phone: normalizePhone(a.phone) },
          weightKg: giver ? kg : undefined,
        });
      }}
    >
      <p className="text-sm font-semibold">
        {giver
          ? tr(
              "কোথা থেকে পাঠাবেন (শুধু কুরিয়ার দেখবে)",
              "Where it's picked up (only the courier sees this)",
            )
          : tr("কোথায় পৌঁছাবে (শুধু কুরিয়ার দেখবে)", "Where it's delivered (only the courier sees this)")}
      </p>
      <Field
        label={tr("নাম", "Name")}
        value={a.name}
        onChange={set("name")}
        error={touched && errors.name ? req : undefined}
      />
      <Field
        label={tr("মোবাইল", "Mobile")}
        inputMode="tel"
        value={a.phone}
        onChange={set("phone")}
        error={touched && errors.phone ? tr("সঠিক নম্বর দিন", "Enter a valid number") : undefined}
      />
      <SelectField
        label={t("districtLbl")}
        value={a.district}
        onChange={(d: string) => setA((p) => ({ ...p, district: d }))}
        placeholder={t("selectOne")}
        options={ALL_DISTRICTS.map((d) => ({ value: d, label: d }))}
        error={touched && errors.district ? req : undefined}
      />
      <Field
        label={t("upazila")}
        value={a.upazila}
        onChange={set("upazila")}
        error={touched && errors.upazila ? req : undefined}
      />
      <Field
        label={t("areaLbl")}
        value={a.area}
        onChange={set("area")}
        error={touched && errors.area ? req : undefined}
      />
      <Field
        label={tr("বাসা/রোড নম্বরসহ পূর্ণ ঠিকানা", "Full address with house/road number")}
        value={a.line}
        onChange={set("line")}
        error={touched && errors.line ? req : undefined}
      />
      {giver && (
        <Field
          label={tr("আনুমানিক ওজন (কেজি)", "Approximate weight (kg)")}
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          error={
            touched && errors.weight ? tr("০.১–৩০ কেজির মধ্যে", "Between 0.1 and 30 kg") : undefined
          }
        />
      )}
      {agree.isError && (
        <ErrorBanner>
          {tr("সেভ করা যায়নি, আবার চেষ্টা করুন।", "Couldn't save — please try again.")}
        </ErrorBanner>
      )}
      <Button type="submit" className="w-full" disabled={agree.isPending}>
        {t("agreeCourier")}
      </Button>
    </form>
  );
}

function PayForm({ v }: { v: CourierView }) {
  const t = useT();
  const tr = useTr();
  const num = useNum();
  const pay = useRequestCourier(v.exchangeId);
  const methods = (["cod", "bkash", "nagad"] as const).filter((m) => v.checkout.methods[m]);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [trx, setTrx] = useState("");
  const [sender, setSender] = useState("");
  const chosen = method ?? methods[0] ?? null;
  const wallet = chosen === "bkash" || chosen === "nagad";
  const trxOk = /^[A-Z0-9]{8,12}$/.test(trx);
  const payOk = !!chosen && (!wallet || (trxOk && isBdMobile(sender)));
  const charge = v.charge ?? 0;
  const err = pay.error?.message;

  const send = () => {
    if (!chosen) return;
    pay.mutate(
      chosen === "cod"
        ? { method: "cod" }
        : { method: chosen, trxId: trx, senderNumber: normalizePhone(sender) },
    );
  };

  return (
    <fieldset className="space-y-2 border-t pt-3">
      <legend className="text-sm font-semibold">{tr("কীভাবে চার্জ দেবেন", "How you'll pay")}</legend>
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
            {tr(`এই নম্বরে ৳${num(charge)} পাঠান`, `Send ৳${charge} to`)}{" "}
            <b className="font-mono">
              {chosen === "bkash" ? v.checkout.bkashNumber : v.checkout.nagadNumber}
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
      {err && (
        <ErrorBanner>
          {err === "trx_used"
            ? tr("এই TrxID আগেই ব্যবহার হয়েছে।", "This TrxID has already been used.")
            : tr("পাঠানো যায়নি, আবার চেষ্টা করুন।", "Couldn't send — please try again.")}
        </ErrorBanner>
      )}
      <Button className="w-full" disabled={!payOk || pay.isPending} onClick={send}>
        {t("sendToAdmin")}
      </Button>
    </fieldset>
  );
}

function Row({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {on ? (
        <CheckCircle2 className="h-5 w-5 text-primary" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground" />
      )}
      {label}
    </div>
  );
}
