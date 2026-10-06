import { useTr } from "@/features/feed/i18n";
import { QueryState } from "@/features/data/QueryState";
import { useAdvanceExchange, useExchanges } from "@/features/data/hooks";
import type { ExchangeStatus } from "@/features/data/types";
import { PageHeading, Pill } from "@/features/feed/parts";
import { categoryOf } from "@/features/feed/types";
import { Button, cn } from "@/shared/components/ui";
import { Check, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

const STEPS: ExchangeStatus[] = ["requested", "accepted", "scheduled", "completed"];

export function ExchangesPage() {
  const tr = useTr();
  const [tab, setTab] = useState<"active" | "done" | "all">("active");
  const { data: items = [], isLoading, error, refetch } = useExchanges();
  const advanceMut = useAdvanceExchange();

  const label: Record<ExchangeStatus, string> = {
    requested: tr("রিকোয়েস্ট", "Requested"),
    accepted: tr("গৃহীত", "Accepted"),
    scheduled: tr("সময় ঠিক", "Scheduled"),
    completed: tr("সম্পন্ন", "Completed"),
    cancelled: tr("বাতিল", "Cancelled"),
  };

  const shown = items.filter((e) =>
    tab === "all"
      ? true
      : tab === "done"
        ? e.status === "completed" || e.status === "cancelled"
        : !["completed", "cancelled"].includes(e.status),
  );

  const advance = (id: string) => advanceMut.mutate(id);

  const tabs = [
    ["active", tr("চলমান", "Active")],
    ["done", tr("শেষ", "Finished")],
    ["all", tr("সব", "All")],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5">
      <Helmet>
        <title>{tr("আদান-প্রদান", "Exchanges")} — ReuseDo</title>
      </Helmet>
      <PageHeading
        title={tr("আদান-প্রদান", "Exchanges")}
        sub={tr("আপনার দেওয়া ও নেওয়া সব জিনিস এক জায়গায়", "Everything you've given and received")}
      />

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold",
              tab === k ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {shown.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            {tr("এখানে কিছু নেই", "Nothing here")}
          </p>
        )}

        <ul className="space-y-3">
          {shown.map((e) => {
            const cat = categoryOf(e.category);
            const idx = STEPS.indexOf(e.status);
            const cancelled = e.status === "cancelled";
            return (
              <li key={e.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl",
                      cat.tone,
                    )}
                  >
                    {cat.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{e.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.role === "giver"
                        ? tr("আপনি দিচ্ছেন →", "You give →")
                        : tr("আপনি নিচ্ছেন ←", "You receive ←")}{" "}
                      {e.other}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Pill
                        tone={
                          cancelled ? "danger" : e.status === "completed" ? "success" : "warning"
                        }
                      >
                        {label[e.status]}
                      </Pill>
                      <Pill>
                        {e.via === "courier" ? (
                          <>
                            <Truck className="mr-1 inline h-3 w-3" />
                            {tr("কুরিয়ার", "Courier")}
                          </>
                        ) : (
                          <>
                            <PackageCheck className="mr-1 inline h-3 w-3" />
                            {tr("সরাসরি", "Pickup")}
                          </>
                        )}
                      </Pill>
                      <span className="text-xs text-muted-foreground">{e.updated}</span>
                    </div>
                  </div>
                </div>

                {!cancelled && (
                  <ol className="mt-4 flex items-center" aria-label="progress">
                    {STEPS.map((s, i) => (
                      <li key={s} className="flex flex-1 items-center last:flex-none">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px]",
                            i <= idx
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground",
                          )}
                          title={label[s]}
                        >
                          {i <= idx && <Check className="h-3 w-3" />}
                        </span>
                        {i < STEPS.length - 1 && (
                          <span
                            className={cn("h-0.5 flex-1", i < idx ? "bg-primary" : "bg-border")}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/messages/c1">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> {tr("চ্যাট", "Chat")}
                    </Link>
                  </Button>
                  {e.role === "giver" && e.status === "requested" && (
                    <Button size="sm" onClick={() => advance(e.id)}>
                      {tr("গ্রহণ করুন", "Accept")}
                    </Button>
                  )}
                  {e.status === "accepted" && e.via === "courier" && (
                    <Button asChild size="sm">
                      <Link to="/courier">{tr("কুরিয়ার", "Courier")}</Link>
                    </Button>
                  )}
                  {(e.status === "scheduled" ||
                    (e.status === "accepted" && e.via === "pickup")) && (
                    <Button size="sm" onClick={() => advance(e.id)}>
                      {e.role === "giver"
                        ? tr("হস্তান্তর হয়েছে", "Handed over")
                        : tr("পেয়েছি", "Received")}
                    </Button>
                  )}
                  {e.status === "completed" && (
                    <Button size="sm" variant="secondary">
                      {tr("রিভিউ দিন", "Leave a review")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </QueryState>
    </div>
  );
}
