import { cn } from "@/shared/components/ui";
import { useNum } from "./i18n";
import { Star } from "lucide-react";
import type { ReactNode } from "react";

export function Initial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary",
        className,
      )}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i <= value ? "fill-need text-need" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

/** Circular trust score (0-100). */
export function TrustRing({ value, size = 72 }: { value: number; size?: number }) {
  const num = useNum();
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <title>trust</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="6"
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="fill-none stroke-primary transition-all"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold">
        {num(value)}
      </span>
    </div>
  );
}

export function PageHeading({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "offer" | "need" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    offer: "bg-offer-soft text-offer",
    need: "bg-need-soft text-need",
    success: "bg-offer-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}
