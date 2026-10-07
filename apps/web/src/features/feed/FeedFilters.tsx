import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@/shared/components/ui";
import { Check, ChevronDown, MapPin, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useLang, useTr } from "./i18n";
import { CATEGORIES, type CategoryId, type PostKind } from "./types";

export type Scope = "area" | "district" | "country";

/** Compact sticky bar: post-type tabs + a location dropdown. Kept to one short row so it never crowds the feed. */
export function FeedToolbar({
  kind,
  onKind,
  scope,
  onScope,
  extra,
}: {
  kind: PostKind | "all";
  onKind: (k: PostKind | "all") => void;
  scope: Scope;
  onScope: (s: Scope) => void;
  /** e.g. the Filters button. */
  extra?: ReactNode;
}) {
  const tr = useTr();
  const tabs: [PostKind | "all", string][] = [
    ["all", tr("সব", "All")],
    ["offer", `🎁 ${tr("দিন", "Give")}`],
    ["need", `🙏 ${tr("চাই", "Need")}`],
  ];
  const scopes: [Scope, string][] = [
    ["area", tr("আমার এলাকা", "My area")],
    ["district", tr("আমার জেলা", "My district")],
    ["country", tr("সারা দেশ", "Nationwide")],
  ];
  const current = scopes.find(([s]) => s === scope)?.[1];

  return (
    <div className="sticky top-14 z-10 -mx-4 border-b bg-background/90 px-4 py-2.5 backdrop-blur sm:top-16">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="tablist">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => onKind(k)}
              className={cn(
                "rounded-lg px-2 py-2 text-sm font-semibold transition-all",
                kind === k
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={tr("এলাকা বেছে নিন", "Choose area")}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="hidden max-w-20 truncate min-[400px]:inline sm:max-w-28">
                {current}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {scopes.map(([s, label]) => (
              <DropdownMenuItem key={s} onClick={() => onScope(s)} className="justify-between">
                {label}
                {scope === s && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {extra}
      </div>
    </div>
  );
}

/** Story-style category picker: round icon + label. Scrolls sideways on phones, fits in one row on desktop. */
export function CategoryStrip({
  value,
  onChange,
}: {
  value: CategoryId | "all";
  onChange: (c: CategoryId | "all") => void;
}) {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const items = [
    { id: "all" as const, label: tr("সব", "All"), emoji: null, tone: "" },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: lang === "bn" ? c.bn : c.en,
      emoji: c.emoji,
      tone: c.tone,
    })),
  ];
  return (
    <nav
      aria-label={tr("ক্যাটাগরি", "Categories")}
      className="-mx-4 overflow-x-auto px-4 py-1.5 scrollbar-none [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)]"
    >
      <ul className="flex min-w-max gap-3 lg:min-w-0 lg:justify-between">
        {items.map((c) => {
          const active = value === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className="group flex w-[4.5rem] flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-all",
                    c.emoji ? `bg-gradient-to-br ${c.tone}` : "bg-primary/10 text-primary",
                    active
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "group-hover:scale-105",
                  )}
                >
                  {c.emoji ?? <Sparkles className="h-6 w-6" />}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-xs",
                    active ? "font-bold text-primary" : "text-muted-foreground",
                  )}
                >
                  {c.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
