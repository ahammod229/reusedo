import { QueryState } from "@/features/data/QueryState";
import { useAdvanceExchange, useExchanges, useSendThanks } from "@/features/data/hooks";
import type { Exchange, ExchangeStatus } from "@/features/data/types";
import { useTr } from "@/features/feed/i18n";
import { useMe } from "@/features/feed/me";
import { PageHeading, Pill } from "@/features/feed/parts";
import { categoryOf } from "@/features/feed/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from "@/shared/components/ui";
import { Check, MessageCircle, PackageCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { HandoverDialog } from "./HandoverDialog";

const STEPS: ExchangeStatus[] = ["requested", "accepted", "scheduled", "completed"];

export function ExchangesPage() {
  const tr = useTr();
  const [tab, setTab] = useState<"active" | "done" | "all">("active");
  const { data: items = [], isLoading, error, refetch } = useExchanges();
  const advanceMut = useAdvanceExchange();
  const thanked = useMe((s) => s.thanked);
  const [thanking, setThanking] = useState<Exchange | null>(null);
  const [handover, setHandover] = useState<Exchange | null>(null);

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
                    <Button size="sm" onClick={() => setHandover(e)}>
                      {e.role === "giver"
                        ? tr("হস্তান্তরের কোড", "Handover code")
                        : tr("পেয়েছি", "Received")}
                    </Button>
                  )}
                  {e.status === "completed" &&
                    (thanked.includes(e.id) ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                        <Check className="h-4 w-4" />
                        {e.role === "receiver"
                          ? tr("ধন্যবাদ জানানো হয়েছে", "Thanked")
                          : tr("রিভিউ দেওয়া হয়েছে", "Reviewed")}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className={cn(
                          e.role === "receiver" && "bg-need text-white hover:bg-need/90",
                        )}
                        onClick={() => setThanking(e)}
                      >
                        {e.role === "receiver"
                          ? `💌 ${tr("ধন্যবাদ জানান", "Say thanks")}`
                          : tr("রিভিউ দিন", "Leave a review")}
                      </Button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      </QueryState>
      <HandoverDialog exchange={handover} onClose={() => setHandover(null)} />
      {thanking && <ThanksDialog e={thanking} onClose={() => setThanking(null)} />}
    </div>
  );
}

/** Receivers thank the giver (shown on the giver's profile); givers leave a short review. */
function ThanksDialog({ e, onClose }: { e: Exchange; onClose: () => void }) {
  const tr = useTr();
  const send = useSendThanks();
  const me = useMe();
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const receiver = e.role === "receiver";
  const ideas = receiver
    ? [
        tr("অনেক কাজে লেগেছে, ধন্যবাদ!", "It helped a lot, thank you!"),
        tr("সময়মতো পেয়েছি", "Got it right on time"),
        tr("জিনিসটা একদম ভালো অবস্থায় ছিল", "It was in great condition"),
      ]
    : [tr("সময়মতো এসেছিলেন", "Came on time"), tr("খুব ভদ্র ও আন্তরিক", "Very polite and kind")];
  const ok = text.trim().length >= 3;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {receiver
              ? tr(`${e.other}-কে ধন্যবাদ জানান`, `Thank ${e.other}`)
              : tr(`${e.other}-এর রিভিউ`, `Review ${e.other}`)}
          </DialogTitle>
          <DialogDescription>
            {receiver
              ? tr(
                  "আপনার কয়েকটা কথা তাঁর প্রোফাইলে থাকবে — আবার দিতে উৎসাহ পাবেন।",
                  "Your words appear on their profile — it encourages them to give again.",
                )
              : e.title}
          </DialogDescription>
        </DialogHeader>
        <fieldset className="flex items-center justify-center gap-1">
          <legend className="sr-only">{tr("রেটিং", "Rating")}</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n}/5`}
              aria-pressed={stars === n}
              onClick={() => setStars(n)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-8 w-8",
                  n <= stars ? "fill-need text-need" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          {ideas.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(i)}
              className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-accent"
            >
              {i}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          maxLength={280}
          value={text}
          onChange={(ev) => setText(ev.target.value)}
          aria-label={tr("আপনার কথা", "Your note")}
          placeholder={tr("আপনার কথা লিখুন…", "Write a few words…")}
          className="w-full rounded-xl border bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
        <Button
          size="lg"
          disabled={!ok || send.isPending}
          onClick={() => {
            if (receiver)
              send.mutate({ exchangeId: e.id, text: text.trim() }, { onSuccess: onClose });
            else {
              // Review API isn't wired yet; remember it locally so the button doesn't reappear.
              me.set({ thanked: [...me.thanked, e.id] });
              onClose();
            }
          }}
        >
          {receiver ? tr("ধন্যবাদ পাঠান", "Send thanks") : tr("রিভিউ দিন", "Submit review")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
