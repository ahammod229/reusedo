import { useTr } from "@/features/feed/i18n";
import { Button, Skeleton } from "@/shared/components/ui";
import type { ReactNode } from "react";

/** Standard loading / error treatment so every screen behaves the same when the API is slow or down. */
export function QueryState({
  isLoading,
  error,
  onRetry,
  rows = 3,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  rows?: number;
  children: ReactNode;
}) {
  const tr = useTr();
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: rows }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"
      >
        <p className="font-semibold text-destructive">{tr("লোড করা যায়নি", "Couldn't load this")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("ইন্টারনেট দেখে আবার চেষ্টা করুন।", "Check your connection and try again.")}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            {tr("আবার চেষ্টা", "Retry")}
          </Button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
