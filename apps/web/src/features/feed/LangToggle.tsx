import { cn } from "@/shared/components/ui";
import { useLang } from "./i18n";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
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
