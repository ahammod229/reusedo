import { advancedCount } from "@/features/data/filtering";
import type { FeedFilters } from "@/features/data/types";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Switch,
  cn,
} from "@/shared/components/ui";
import { BellPlus, Check, SlidersHorizontal, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useAlerts } from "./alerts";
import { RESET_ADVANCED } from "./feedParams";
import { useLang, useNum, useTr } from "./i18n";
import { CATEGORIES, EDU_LEVELS } from "./types";

/** "Filters (3)" button for the toolbar. */
export function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  const tr = useTr();
  const num = useNum();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tr("ফিল্টার", "Filters")}
      className={cn(
        "relative flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors",
        count ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-accent",
      )}
    >
      <SlidersHorizontal className="h-4 w-4" />
      <span className="hidden sm:inline">{tr("ফিল্টার", "Filters")}</span>
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
          {num(count)}
        </span>
      )}
    </button>
  );
}

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  filters: FeedFilters;
  onApply: (f: Partial<FeedFilters>) => void;
  /** Live count for the current draft, so people see the effect before applying. */
  resultCount?: (f: FeedFilters) => number;
}) {
  const tr = useTr();
  const num = useNum();
  const lang = useLang((s) => s.lang);
  const [d, setD] = useState<FeedFilters>(filters);
  // Start from the applied filters each time the sheet opens.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when opened
  useEffect(() => {
    if (open) setD(filters);
  }, [open]);
  const set = (p: Partial<FeedFilters>) => setD((c) => ({ ...c, ...p }));
  const n = resultCount?.(d);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between gap-3 border-b py-3 pl-4 pr-14">
          <SheetTitle className="text-lg font-bold">{tr("ফিল্টার", "Filters")}</SheetTitle>
          <SheetDescription className="sr-only">
            {tr("ফিড ছেঁকে নিন", "Narrow down the feed")}
          </SheetDescription>
          <button
            type="button"
            className="text-sm font-semibold text-primary"
            onClick={() => set({ ...RESET_ADVANCED, kind: "all", category: "all" })}
          >
            {tr("সব মুছুন", "Clear all")}
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <Group title={tr("ধরন", "Type")}>
            <Chips
              value={d.kind}
              onChange={(v) => set({ kind: v })}
              options={[
                ["all", tr("সব", "All")],
                ["offer", `🎁 ${tr("দেওয়া হচ্ছে", "Offered")}`],
                ["need", `🙏 ${tr("দরকার", "Needed")}`],
              ]}
            />
          </Group>

          <Group title={tr("ক্যাটাগরি", "Category")}>
            <Chips
              value={d.category}
              onChange={(v) => set({ category: v })}
              options={[
                ["all", tr("সব", "All")],
                ...CATEGORIES.map(
                  (c) => [c.id, `${c.emoji} ${lang === "bn" ? c.bn : c.en}`] as [string, string],
                ),
              ]}
            />
          </Group>

          <Group title={tr("পড়াশোনার স্তর", "Study level")}>
            <Chips
              value={d.level ?? "all"}
              onChange={(v) => set({ level: v as FeedFilters["level"] })}
              options={[
                ["all", tr("যেকোনো", "Any")],
                ...EDU_LEVELS.map((l) => [l.id, lang === "bn" ? l.bn : l.en] as [string, string]),
              ]}
            />
          </Group>

          <Group title={tr("অবস্থা", "Condition")}>
            <MultiChips
              value={d.conditions ?? []}
              onChange={(v) => set({ conditions: v as FeedFilters["conditions"] })}
              options={[
                ["new", tr("নতুন", "New")],
                ["good", tr("ভালো", "Good")],
                ["used", tr("ব্যবহৃত", "Used")],
              ]}
            />
          </Group>

          <Group title={tr("কীভাবে পাবেন", "How you get it")}>
            <Chips
              value={d.delivery ?? "any"}
              onChange={(v) => set({ delivery: v as FeedFilters["delivery"] })}
              options={[
                ["any", tr("যেকোনো", "Any")],
                ["pickup", tr("নিজে নেওয়া", "Pickup")],
                ["courier", tr("কুরিয়ার", "Courier")],
              ]}
            />
          </Group>

          <Group title={tr("কবে পোস্ট", "Posted")}>
            <Chips
              value={d.within ?? "any"}
              onChange={(v) => set({ within: v as FeedFilters["within"] })}
              options={[
                ["any", tr("যেকোনো সময়", "Any time")],
                ["24h", tr("২৪ ঘণ্টায়", "Last 24h")],
                ["7d", tr("এই সপ্তাহে", "This week")],
              ]}
            />
          </Group>

          <Group title={tr("সাজান", "Sort by")}>
            <Chips
              value={d.sort ?? "near"}
              onChange={(v) => set({ sort: v as FeedFilters["sort"] })}
              options={[
                ["near", tr("কাছের আগে", "Nearest")],
                ["new", tr("নতুন আগে", "Newest")],
                ["urgent", tr("জরুরি আগে", "Most urgent")],
                ["popular", tr("জনপ্রিয়", "Popular")],
              ]}
            />
          </Group>

          <div className="divide-y rounded-2xl border">
            <Toggle
              label={tr("শুধু যাচাই করা সদস্য", "Verified members only")}
              checked={!!d.verifiedOnly}
              onChange={(v) => set({ verifiedOnly: v })}
            />
            <Toggle
              label={tr("শুধু ছবিসহ পোস্ট", "With photos only")}
              checked={!!d.photoOnly}
              onChange={(v) => set({ photoOnly: v })}
            />
            <Toggle
              label={tr("শুধু জরুরি দরকার", "Urgent needs only")}
              checked={!!d.urgentOnly}
              onChange={(v) => set({ urgentOnly: v })}
            />
            <Toggle
              label={tr("দেওয়া হয়ে গেছে এমনও দেখান", "Include given-away posts")}
              checked={!!d.showGiven}
              onChange={(v) => set({ showGiven: v })}
            />
          </div>
        </div>

        <div className="border-t p-4 pb-safe">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              onApply(d);
              onOpenChange(false);
            }}
          >
            {n === undefined
              ? tr("দেখান", "Show results")
              : tr(`${num(n)}টি পোস্ট দেখান`, `Show ${n} posts`)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Removable chips for the filters that are on, plus "save this search". */
export function ActiveFilters({
  filters,
  onChange,
}: {
  filters: FeedFilters;
  onChange: (p: Partial<FeedFilters>) => void;
}) {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const addAlert = useAlerts((s) => s.add);
  const [saved, setSaved] = useState(false);
  const chips: { key: string; label: string; clear: Partial<FeedFilters> }[] = [];
  const lvl = EDU_LEVELS.find((l) => l.id === filters.level);
  if (lvl)
    chips.push({ key: "level", label: lang === "bn" ? lvl.bn : lvl.en, clear: { level: "all" } });
  for (const c of filters.conditions ?? [])
    chips.push({
      key: `c-${c}`,
      label: { new: tr("নতুন", "New"), good: tr("ভালো", "Good"), used: tr("ব্যবহৃত", "Used") }[c],
      clear: { conditions: filters.conditions?.filter((x) => x !== c) },
    });
  if (filters.delivery && filters.delivery !== "any")
    chips.push({
      key: "via",
      label: filters.delivery === "pickup" ? tr("নিজে নেওয়া", "Pickup") : tr("কুরিয়ার", "Courier"),
      clear: { delivery: "any" },
    });
  if (filters.within && filters.within !== "any")
    chips.push({
      key: "within",
      label: filters.within === "24h" ? tr("২৪ ঘণ্টায়", "Last 24h") : tr("এই সপ্তাহে", "This week"),
      clear: { within: "any" },
    });
  if (filters.verifiedOnly)
    chips.push({ key: "v", label: tr("যাচাই করা", "Verified"), clear: { verifiedOnly: false } });
  if (filters.photoOnly)
    chips.push({ key: "ph", label: tr("ছবিসহ", "With photo"), clear: { photoOnly: false } });
  if (filters.urgentOnly)
    chips.push({ key: "u", label: tr("জরুরি", "Urgent"), clear: { urgentOnly: false } });
  if (filters.showGiven)
    chips.push({
      key: "g",
      label: tr("দেওয়া হয়ে গেছেও", "Incl. given"),
      clear: { showGiven: false },
    });
  if (filters.sort && filters.sort !== "near")
    chips.push({
      key: "sort",
      label: {
        new: tr("নতুন আগে", "Newest"),
        urgent: tr("জরুরি আগে", "Most urgent"),
        popular: tr("জনপ্রিয়", "Popular"),
      }[filters.sort],
      clear: { sort: "near" },
    });

  const anything =
    chips.length > 0 || filters.category !== "all" || filters.kind !== "all" || !!filters.q;
  if (!anything) return null;

  const label = [
    filters.q,
    filters.kind === "need"
      ? tr("দরকার", "Needs")
      : filters.kind === "offer"
        ? tr("দেওয়া", "Offers")
        : null,
    CATEGORIES.find((c) => c.id === filters.category)?.[lang === "bn" ? "bn" : "en"],
    lvl?.short,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.clear)}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
          aria-label={`${c.label} ${tr("সরান", "remove")}`}
        >
          {c.label} <X className="h-3.5 w-3.5" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(RESET_ADVANCED)}
          className="px-2 text-xs font-semibold text-muted-foreground underline"
        >
          {tr("সব মুছুন", "Clear")}
        </button>
      )}
      <button
        type="button"
        disabled={saved}
        onClick={() => {
          addAlert({ label: label || tr("আমার খোঁজ", "My search"), filters });
          setSaved(true);
        }}
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:text-success"
      >
        {saved ? <Check className="h-3.5 w-3.5" /> : <BellPlus className="h-3.5 w-3.5" />}
        {saved ? tr("নতুন পোস্টে জানাব", "We'll notify you") : tr("এই খোঁজ সেভ করুন", "Save this search")}
      </button>
    </div>
  );
}

export { advancedCount };

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Chips<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (v: V) => void;
  options: [V, string][];
}) {
  return <ChipRow isOn={(v) => value === v} onClick={onChange} options={options} />;
}

function MultiChips<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V[];
  onChange: (v: V[]) => void;
  options: [V, string][];
}) {
  return (
    <ChipRow
      isOn={(v) => value.includes(v)}
      onClick={(v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])}
      options={options}
    />
  );
}

function ChipRow<V extends string>({
  isOn,
  onClick,
  options,
}: {
  isOn: (v: V) => boolean;
  onClick: (v: V) => void;
  options: [V, string][];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={isOn(v)}
          onClick={() => onClick(v)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            isOn(v)
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:bg-accent",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
