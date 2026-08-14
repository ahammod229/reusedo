import type * as React from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../../lib/utils";

export interface MobileNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export interface MobileBottomNavProps {
  items: MobileNavItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-2 pb-safe md:hidden">
      {items.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== "/" && location.pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 rounded-md px-3 py-1",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center">{item.icon}</div>
            <span className="text-[10px] font-medium leading-none">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
