import { QueryState } from "@/features/data/QueryState";
import { useAgreeCourier, useCourierRequests, useExchanges } from "@/features/data/hooks";
import type { CourierRequest as CourierItem, Exchange } from "@/features/data/types";
import { useNum, useT, useTr } from "@/features/feed/i18n";
import { PageHeading } from "@/features/feed/parts";
import { categoryOf } from "@/features/feed/types";
import { Badge, Button, Card, cn } from "@/shared/components/ui";
import { CheckCircle2, Circle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router";

/**
 * Courier delivery. Both people agree; the request then waits for an admin, who books the parcel with Steadfast.
 * The courier fee is paid in cash by the receiver on delivery (no online payment).
 */
export function CourierRequest() {
  const t = useT();
  const tr = useTr();
  const [params] = useSearchParams();
  const exchanges = useExchanges();
  const requests = useCourierRequests();
  const id = params.get("exchange");

  const eligible = (exchanges.data ?? []).filter(
    (e) => e.via === "courier" && ["accepted", "scheduled", "completed"].includes(e.status),
  );
  const chosen = id ? (exchanges.data ?? []).find((e) => e.id === id) : undefined;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
      <Helmet>
        <title>ReuseDo — {t("courierTitle")}</title>
      </Helmet>
      <PageHeading title={t("courierTitle")} sub={t("courierHint")} />
      <QueryState
        isLoading={exchanges.isLoading || requests.isLoading}
        error={exchanges.error ?? requests.error}
        onRetry={() => {
          exchanges.refetch();
          requests.refetch();
        }}
        rows={2}
      >
        {chosen ? (
          <Detail exchange={chosen} request={(requests.data ?? []).find((r) => r.exchangeId === chosen.id)} />
        ) : eligible.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {tr(
              "কুরিয়ারে নেওয়া কোনো আদান-প্রদান নেই। কোনো পোস্টে রিকোয়েস্ট করার সময় “কুরিয়ার” বেছে নিন।",
              "No courier exchanges yet. Choose “Courier” when you request something.",
            )}
          </Card>
        ) : (
          <ul className="space-y-2">
            {eligible.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/courier?exchange=${e.id}`}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:bg-accent"
                >
                  <span className="text-2xl">{categoryOf(e.category).emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{e.other}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </div>
  );
}

type Step = "agree" | "review" | "ready";

function Detail({ exchange, request }: { exchange: Exchange; request?: CourierItem }) {
  const t = useT();
  const tr = useTr();
  const num = useNum();
  const agree = useAgreeCourier();
  const ok = exchange.courierOk ?? { giver: false, receiver: false };
  const mine = exchange.role === "giver" ? ok.giver : ok.receiver;
  const both = ok.giver && ok.receiver;

  const step: Step = request?.status === "confirmed" ? "ready" : both ? "review" : "agree";
  const steps: { id: Step; label: string }[] = [
    { id: "agree", label: tr("সম্মতি", "Agreement") },
    { id: "review", label: tr("অ্যাডমিন রিভিউ", "Admin review") },
    { id: "ready", label: tr("কুরিয়ার প্রস্তুত", "Courier booked") },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  const canAgree = ["accepted", "scheduled"].includes(exchange.status);

  return (
    <div className="space-y-4">
      <Card className="space-y-1 p-4">
        <div className="text-sm text-muted-foreground">{tr("জিনিস", "Item")}</div>
        <div className="font-semibold">{exchange.title}</div>
        <div className="text-xs text-muted-foreground">
          {exchange.role === "giver" ? tr("আপনি দিচ্ছেন", "You give") : tr("আপনি নিচ্ছেন", "You receive")} ·{" "}
          {exchange.other}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <Row label={t("giverAgree")} on={ok.giver} />
        <Row label={t("receiverAgree")} on={ok.receiver} />
        {!mine && canAgree && (
          <Button
            className="w-full"
            disabled={agree.isPending}
            onClick={() => agree.mutate(exchange.id)}
          >
            {t("agreeCourier")}
          </Button>
        )}
        {mine && !both && (
          <p className="text-sm text-muted-foreground">{t("waitingBoth")}</p>
        )}
        {agree.isError && (
          <p role="alert" className="text-sm text-destructive">
            {tr("পাঠানো যায়নি, আবার চেষ্টা করুন।", "Couldn't send. Try again.")}
          </p>
        )}

        <div className="flex items-center justify-between rounded-lg bg-warning-soft p-3 text-sm text-warning">
          <span>{t("charge")}</span>
          <span className="text-lg font-bold">
            {request ? `৳${num(request.charge)}` : tr("৳৮০–১৩০", "৳80–130")}
          </span>
        </div>
        {!request && (
          <p className="text-xs text-muted-foreground">
            {tr(
              "একই জেলায় ৳৮০, অন্য জেলায় ৳১৩০ — অ্যাডমিন কনফার্ম করলে চূড়ান্ত হবে।",
              "৳80 within a district, ৳130 across districts — final once an admin confirms.",
            )}
          </p>
        )}
        {request?.status === "rejected" && (
          <p role="alert" className="text-sm text-destructive">
            {tr("অ্যাডমিন এই কুরিয়ার রিকোয়েস্ট গ্রহণ করেননি।", "An admin declined this courier request.")}
          </p>
        )}
        {request?.tracking && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            {t("tracking")}: <b className="font-mono">{request.tracking}</b>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={cn("flex items-center gap-3 text-sm", i > idx && "text-muted-foreground")}
            >
              {i <= idx ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
              {s.label}
              {i === idx && <Badge variant="secondary">{tr("এখন", "Now")}</Badge>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
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
