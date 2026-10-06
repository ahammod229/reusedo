import { cn } from "../../lib/utils";

/** Two leaves forming a hand-over: the mark for "give / receive". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="ReuseDo"
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 20c0-5.5 3.6-9 9.5-9.5.3 5.9-3 9.5-9.5 9.5Z"
        className="fill-primary-foreground"
      />
      <path
        d="M23 12.5c0 5.2-3.3 8.5-8.8 9-.2-5.5 2.8-8.8 8.8-9Z"
        className="fill-primary-foreground"
        opacity=".6"
      />
    </svg>
  );
}

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showText && (
        <span className="text-xl font-extrabold tracking-tight">
          Reuse<span className="text-primary">Do</span>
        </span>
      )}
    </span>
  );
}
