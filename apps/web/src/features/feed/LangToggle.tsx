import { cn } from "@/shared/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "./i18n";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const qc = useQueryClient();
  return (
    <button
      type="button"
      onClick={() => {
        setLang(lang === "bn" ? "en" : "bn");
        // Times like "৩ ঘণ্টা আগে" are formatted when data loads; reload them in the new language.
        qc.invalidateQueries();
      }}
      aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
      className={cn(
        "h-9 rounded-full border bg-background px-3 text-xs font-semibold text-foreground/80 transition-colors hover:bg-accent",
        className,
      )}
    >
      {lang === "bn" ? "EN" : "বাং"}
    </button>
  );
}
