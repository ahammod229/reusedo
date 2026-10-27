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

/** Pill styling shared by every feed control, so the filter row reads as one quiet line. */
export const chip = (active = false) =>
  cn(
    "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80 hover:bg-accent",
  );

/** One scrollable row of pills: post type, area, then extras (view, filters). Sticks under the header on desktop. */
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
    ["offer", tr("🎁 দিচ্ছেন", "🎁 Giving")],
    ["need", tr("🙏 চাইছেন", "🙏 Asking")],
  ];
  const scopes: [Scope, string][] = [
    ["area", tr("আমার এলাকা", "My area")],
    ["district", tr("আমার জেলা", "My district")],
    ["country", tr("সারা দেশ", "Nationwide")],
  ];
  const current = scopes.find(([s]) => s === scope)?.[1];

  return (
    <div className="z-10 md:sticky md:top-16 md:-mx-1 md:bg-background/90 md:px-1 md:py-1 md:backdrop-blur">
      <div
        className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0"
        role="tablist"
      >
        {tabs.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => onKind(k)}
            className={chip(kind === k)}
          >
            {label}
          </button>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={tr("এলাকা বেছে নিন", "Choose area")} className={chip()}>
              <MapPin className="h-4 w-4 text-primary" />
              {current}
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

/** Category pills (emoji + name). Scrolls sideways on phones. */
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
    { id: "all" as const, label: tr("সব ক্যাটাগরি", "All categories"), emoji: null },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: lang === "bn" ? c.bn : c.en,
      emoji: c.emoji,
    })),
  ];
  return (
    <nav
      aria-label={tr("ক্যাটাগরি", "Categories")}
      className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-2">
        {items.map((c) => {
          const active = value === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-card text-foreground/75 hover:bg-accent",
                )}
              >
                {c.emoji ? (
                  <span aria-hidden>{c.emoji}</span>
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {c.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
