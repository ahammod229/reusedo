import type * as React from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../../lib/utils";

export interface MobileNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  /** Renders as the raised centre action button. */
  primary?: boolean;
}

export interface MobileBottomNavProps {
  items: MobileNavItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-end justify-around px-2">
        {items.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          if (item.primary) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="-mt-5 flex flex-col items-center gap-1 pb-1.5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95">
                  {item.icon}
                </span>
                <span className="text-[11px] font-semibold leading-none text-primary">
                  {item.title}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-2 pb-2 pt-2.5",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center">{item.icon}</div>
              <span className="text-[11px] font-medium leading-none">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
