import type * as React from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../../lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export interface SidebarProps {
  items: NavItem[];
  className?: string;
  title?: string;
  footer?: React.ReactNode;
}

export function Sidebar({ items, className, title, footer }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r bg-sidebar px-3 py-5 md:flex",
        className,
      )}
    >
      {title && (
        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/75 hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
              {item.title}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="mt-auto pt-6">{footer}</div>}
    </aside>
  );
}
