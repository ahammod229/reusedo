import type * as React from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../../lib/utils";

export interface MobileNavItem {
  title: string;
  /** A link tab; leave out and pass onClick for a tab that opens something (the menu). */
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  /** Highlighted create action in the middle. */
  primary?: boolean;
  /** Forces the active state, e.g. while the menu it opens is showing. */
  active?: boolean;
}

export interface MobileBottomNavProps {
  items: MobileNavItem[];
}

/** Flat tab bar for phones: icon + label, a coloured bar marks the current tab. */
export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid h-14 max-w-lg grid-cols-5">
        {items.map((item) => {
          const isActive =
            item.active ??
            (item.href !== undefined &&
              (location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(`${item.href}/`))));

          const cls = cn(
            "relative flex flex-col items-center justify-center gap-1 transition-colors active:bg-muted",
            isActive || item.primary ? "text-primary" : "text-muted-foreground",
          );

          return item.href ? (
            <Link
              key={item.title}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              // Tapping the tab you're already on scrolls back to the top, like most social apps.
              onClick={() => {
                if (isActive) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cls}
            >
              <TabBody item={item} active={isActive} />
            </Link>
          ) : (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              aria-expanded={isActive}
              className={cls}
            >
              <TabBody item={item} active={isActive} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TabBody({ item, active }: { item: MobileNavItem; active: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "flex items-center justify-center",
          item.primary
            ? "h-8 w-11 rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30"
            : "h-6 w-6",
        )}
      >
        {item.icon}
      </span>
      <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>
        {item.title}
      </span>
    </>
  );
}
