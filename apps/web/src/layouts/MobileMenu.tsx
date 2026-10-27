import { useLang, useT, useTr } from "@/features/feed/i18n";
import { useStartInstall } from "@/features/pwa/InstallBanner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  cn,
  useTheme,
} from "@/shared/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Download, Globe, LogOut, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface Item {
  title: string;
  href: string;
  icon: ReactNode;
}

// One soft colour per shortcut so the grid scans quickly.
const TONES = [
  "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  "bg-rose-500/12 text-rose-600 dark:text-rose-400",
  "bg-teal-500/12 text-teal-600 dark:text-teal-400",
];

/** The phone "Menu" tab: who you are, every shortcut, and app settings in one screen. */
export function MobileMenu({
  open,
  onOpenChange,
  items,
  user,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: Item[];
  user: { name: string; avatar?: string } | null;
  onLogout: () => void;
}) {
  const t = useT();
  const tr = useTr();
  const close = () => onOpenChange(false);
  const { lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const installer = useStartInstall();
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  const row =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium transition-colors active:bg-muted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto bg-background p-0 sm:max-w-sm"
      >
        <div className="px-4 pb-2 pt-4">
          <SheetTitle className="text-2xl font-bold">{t("menu")}</SheetTitle>
          <SheetDescription className="sr-only">{t("footerNote")}</SheetDescription>
        </div>

        <div className="space-y-4 px-4 pb-8">
          {user ? (
            <Link
              to="/profile"
              onClick={close}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm active:bg-muted"
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={user.avatar} alt="" />
                <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{user.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {tr("আপনার প্রোফাইল দেখুন", "See your profile")}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ) : (
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("footerNote")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={close}>
                  <Link to="/login">{t("login")}</Link>
                </Button>
                <Button asChild onClick={close}>
                  <Link to="/register">{t("register")}</Link>
                </Button>
              </div>
            </div>
          )}

          <nav className="grid grid-cols-2 gap-2">
            {items.map((item, i) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={close}
                className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-sm transition-transform active:scale-[0.98]"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    TONES[i % TONES.length],
                  )}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="rounded-2xl bg-card p-1 shadow-sm">
            {installer.mode && (
              <button type="button" className={cn(row, "text-primary")} onClick={installer.start}>
                <Download className="h-5 w-5" />
                <span className="flex-1">{tr("অ্যাপ ইনস্টল করুন", "Install the app")}</span>
              </button>
            )}
            <button
              type="button"
              className={row}
              onClick={() => {
                setLang(lang === "bn" ? "en" : "bn");
                // Times like "৩ ঘণ্টা আগে" are formatted when data loads; reload them in the new language.
                qc.invalidateQueries();
              }}
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1">{tr("ভাষা", "Language")}</span>
              <span className="text-sm text-muted-foreground">
                {lang === "bn" ? "বাংলা → English" : "English → বাংলা"}
              </span>
            </button>
            <button type="button" className={row} onClick={() => setTheme(dark ? "light" : "dark")}>
              {dark ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="flex-1">
                {dark ? tr("লাইট মোড", "Light mode") : tr("ডার্ক মোড", "Dark mode")}
              </span>
            </button>
            {user && (
              <button
                type="button"
                className={cn(row, "text-destructive")}
                onClick={() => {
                  close();
                  onLogout();
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="flex-1">{t("logout")}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
            <Link to="/about" onClick={close}>
              {t("footerAbout")}
            </Link>
            <Link to="/terms" onClick={close}>
              {t("footerTerms")}
            </Link>
            <Link to="/privacy" onClick={close}>
              {t("footerPrivacy")}
            </Link>
            <Link to="/contact" onClick={close}>
              {t("footerContact")}
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground">© ReuseDo</p>
          {installer.dialog}
        </div>
      </SheetContent>
    </Sheet>
  );
}
