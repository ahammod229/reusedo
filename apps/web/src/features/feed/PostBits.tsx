import { useReportPost } from "@/features/data/hooks";
import type { ReportReason } from "@/features/data/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from "@/shared/components/ui";
import { CheckCircle2, GraduationCap, PackageCheck, Truck } from "lucide-react";
import { useState } from "react";
import { useLang, useNum, useTr } from "./i18n";
import { type FeedPost, eduOf } from "./types";

/** Small tags under a post: study level, urgency, delivery, quantity. */
export function PostTags({ post, compact = false }: { post: FeedPost; compact?: boolean }) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const edu = eduOf(post.edu?.level);
  const tag = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {post.kind === "need" && post.urgency === "urgent" && (
        <span className={cn(tag, "bg-destructive/10 text-destructive")}>
          ⏰ {tr("জরুরি", "Urgent")}
        </span>
      )}
      {post.kind === "need" && post.urgency === "soon" && (
        <span className={cn(tag, "bg-warning-soft text-warning")}>
          {tr("এই মাসে দরকার", "Needed this month")}
        </span>
      )}
      {edu && (
        <span className={cn(tag, "bg-primary/10 text-primary")}>
          <GraduationCap className="h-3.5 w-3.5" />
          {compact ? edu.short : lang === "bn" ? edu.bn : edu.en}
        </span>
      )}
      {!compact && post.edu?.detail && (
        <span className={cn(tag, "bg-muted text-muted-foreground")}>{post.edu.detail}</span>
      )}
      {post.qty && post.qty > 1 && (
        <span className={cn(tag, "bg-muted text-muted-foreground")}>
          {num(post.qty)}
          {tr("টি", " pcs")}
        </span>
      )}
      {!compact &&
        post.delivery.map((d) => (
          <span key={d} className={cn(tag, "bg-muted text-muted-foreground")}>
            {d === "pickup" ? (
              <PackageCheck className="h-3.5 w-3.5" />
            ) : (
              <Truck className="h-3.5 w-3.5" />
            )}
            {d === "pickup" ? tr("নিজে নেওয়া", "Pickup") : tr("কুরিয়ার", "Courier")}
          </span>
        ))}
    </div>
  );
}

/** Ribbon for reserved / given posts. Given posts stay visible a while: "it works here". */
export function StatusRibbon({ status }: { status: FeedPost["status"] }) {
  const tr = useTr();
  if (status === "available") return null;
  return (
    <span
      className={cn(
        "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm",
        status === "given" ? "bg-success text-white" : "bg-warning text-white",
      )}
    >
      {status === "given" ? `🎉 ${tr("দেওয়া হয়ে গেছে", "Given away")}` : tr("রিজার্ভ করা", "Reserved")}
    </span>
  );
}

/** Web Share on phones, copy-link elsewhere. Returns whether the link was copied (for feedback). */
export function useShare() {
  const [copied, setCopied] = useState(false);
  const share = async (title: string, path: string) => {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };
  return { share, copied };
}

const REASONS: { id: ReportReason; bn: string; en: string }[] = [
  { id: "fraud", bn: "প্রতারণা / টাকা চাইছে", en: "Scam / asking for money" },
  { id: "fake_item", bn: "জিনিস ছবির সাথে মেলে না", en: "Item doesn't match" },
  { id: "inappropriate", bn: "অশালীন বা নিষিদ্ধ জিনিস", en: "Inappropriate or banned" },
  { id: "spam", bn: "স্প্যাম / বারবার পোস্ট", en: "Spam" },
  { id: "sold", bn: "বিক্রি করছে (বিনামূল্যে নয়)", en: "Selling, not free" },
  { id: "other", bn: "অন্য কিছু", en: "Something else" },
];

export function ReportDialog({
  post,
  open,
  onOpenChange,
}: {
  post: FeedPost;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const tr = useTr();
  const report = useReportPost();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setReason(null);
      setDetails("");
      report.reset();
    }
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-md">
        {report.isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <DialogTitle>{tr("ধন্যবাদ, আমরা দেখছি", "Thanks — we're on it")}</DialogTitle>
            <DialogDescription>
              {tr(
                "মডারেটর ২৪ ঘণ্টার মধ্যে দেখবেন। আপনার নাম পোস্টদাতা জানবেন না।",
                "A moderator reviews it within 24 hours. The poster won't see your name.",
              )}
            </DialogDescription>
            <Button className="mt-2" onClick={() => close(false)}>
              {tr("ঠিক আছে", "OK")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{tr("রিপোর্ট করুন", "Report")}</DialogTitle>
              <DialogDescription>{post.title}</DialogDescription>
            </DialogHeader>
            <fieldset className="grid gap-2">
              <legend className="sr-only">{tr("কারণ", "Reason")}</legend>
              {REASONS.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  {tr(r.bn, r.en)}
                </label>
              ))}
            </fieldset>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              maxLength={300}
              aria-label={tr("বিস্তারিত (ঐচ্ছিক)", "Details (optional)")}
              placeholder={tr("বিস্তারিত (ঐচ্ছিক)", "Details (optional)")}
              className="w-full rounded-xl border bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
            <Button
              size="lg"
              disabled={!reason || report.isPending}
              onClick={() => reason && report.mutate({ postId: post.id, reason, details })}
            >
              {tr("রিপোর্ট পাঠান", "Send report")}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
