import { useTr } from "@/features/feed/i18n";

/** Full-screen loading state while a page's code or the session loads. */
export function PageLoading() {
  const tr = useTr();
  return (
    <output className="flex min-h-[60vh] w-full items-center justify-center" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <span className="text-sm">{tr("লোড হচ্ছে…", "Loading…")}</span>
      </div>
    </output>
  );
}
