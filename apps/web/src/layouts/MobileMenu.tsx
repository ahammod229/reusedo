import { useT } from "@/features/feed/i18n";
import {
  Logo,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  ThemeToggle,
  cn,
} from "@/shared/components/ui";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

interface Item {
  title: string;
  href: string;
  icon: ReactNode;
}

/** Slide-in drawer opened by the header hamburger on phones. */
export function MobileMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: Item[];
}) {
  const t = useT();
  const { pathname } = useLocation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[82%] max-w-xs flex-col gap-0 p-0">
        <div className="border-b px-5 py-4">
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs">{t("footerNote")}</SheetDescription>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium",
                  active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-accent",
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
          <span>{t("menu")}</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
