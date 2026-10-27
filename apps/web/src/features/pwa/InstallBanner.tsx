import { useTr } from "@/features/feed/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from "@/shared/components/ui";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { useState } from "react";
import { useInstall } from "./install";

/** Steps for iPhone/iPad, where Safari has no install button of its own. */
function IosSteps({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const tr = useTr();
  const steps = [
    {
      icon: Share,
      text: tr("নিচের Share বাটনে চাপুন (Safari-তে)", "Tap the Share button (in Safari)"),
    },
    {
      icon: PlusSquare,
      text: tr("“Add to Home Screen” বেছে নিন", "Choose “Add to Home Screen”"),
    },
    { icon: Download, text: tr("উপরে “Add” চাপুন — ব্যস!", "Tap “Add” — done!") },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tr("iPhone-এ ইনস্টল করুন", "Install on iPhone")}</DialogTitle>
          <DialogDescription>
            {tr("হোম স্ক্রিন থেকে অ্যাপের মতোই খুলবে।", "It opens from your home screen like an app.")}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.text} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-sm">
                <b>{i + 1}.</b> {s.text}
              </span>
            </li>
          ))}
        </ol>
        <Button onClick={() => onOpenChange(false)}>{tr("বুঝেছি", "Got it")}</Button>
      </DialogContent>
    </Dialog>
  );
}

/** Starts the install: the browser's own prompt, or the iPhone steps. */
export function useStartInstall() {
  const { mode, install } = useInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const start = () => (mode === "ios" ? setIosOpen(true) : install());
  const dialog = <IosSteps open={iosOpen} onOpenChange={setIosOpen} />;
  return { mode, start, dialog };
}

/** Slim "install the app" card for the top of the feed on phones. Hidden once installed or closed. */
export function InstallBanner({ className }: { className?: string }) {
  const tr = useTr();
  const { showBanner, dismiss } = useInstall();
  const { start, dialog } = useStartInstall();
  if (!showBanner) return dialog;
  return (
    <section
      className={cn(
        "flex items-center gap-3 bg-card px-4 py-3 sm:rounded-2xl sm:border sm:shadow-sm",
        className,
      )}
    >
      <img src="/pwa-192x192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{tr("ReuseDo অ্যাপ নিন", "Get the ReuseDo app")}</p>
        <p className="truncate text-xs text-muted-foreground">
          {tr("হোম স্ক্রিন থেকে এক চাপে খুলুন", "Open it in one tap from your home screen")}
        </p>
      </div>
      <Button size="sm" className="rounded-full" onClick={start}>
        {tr("ইনস্টল", "Install")}
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={tr("বন্ধ করুন", "Close")}
        className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      {dialog}
    </section>
  );
}
