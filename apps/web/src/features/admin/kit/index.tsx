import { useNum, useTr } from "@/features/feed/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch,
  cn,
} from "@/shared/components/ui";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link } from "react-router";

/** Page frame: title, description and a right-aligned action slot. */
export function AdminPage({
  title,
  desc,
  actions,
  children,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  /** Percent change vs previous period; omit for none. */
  delta?: number;
  icon: ReactNode;
  href?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const body = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition-colors",
        href && "hover:border-primary/40 hover:bg-accent/40",
        tone === "warning" && "border-warning/30",
        tone === "danger" && "border-destructive/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            tone === "default" && "bg-primary/10 text-primary",
            tone === "warning" && "bg-warning-soft text-warning",
            tone === "danger" && "bg-destructive/10 text-destructive",
          )}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-extrabold leading-none">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-bold",
              delta >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link to={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export interface Col<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Used as the card title on phones. Exactly one column should set this. */
  primary?: boolean;
  /** Action buttons: right-aligned on desktop, full-width row at the bottom of the card on phones. */
  actions?: boolean;
}

/** Table on md+, stacked cards below. Never scrolls sideways. */
export function DataTable<T>({
  rows,
  cols,
  rowKey,
  empty,
}: {
  rows: T[];
  cols: Col<T>[];
  rowKey: (r: T) => string;
  empty?: string;
}) {
  const tr = useTr();
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border bg-card py-16 text-center text-muted-foreground">
        <p className="mb-2 text-3xl">🗂️</p>
        {empty ?? tr("কিছু পাওয়া যায়নি", "Nothing found")}
      </div>
    );
  }
  const primary = cols.find((c) => c.primary) ?? cols[0];
  const actions = cols.find((c) => c.actions);
  const rest = cols.filter((c) => c !== primary && c !== actions);

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={cn("px-4 py-3", c.actions && "text-right", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={rowKey(r)} className="transition-colors hover:bg-accent/40">
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-4 py-3 align-middle", c.actions && "text-right", c.className)}
                  >
                    {c.actions ? (
                      <div className="flex items-center justify-end gap-2">{c.cell(r)}</div>
                    ) : (
                      c.cell(r)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} className="rounded-2xl border bg-card p-4">
            <div className="font-bold leading-snug">{primary.cell(r)}</div>
            <dl className="mt-3 space-y-1.5 text-sm">
              {rest.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">{c.header}</dt>
                  <dd className="min-w-0 text-right">{c.cell(r)}</dd>
                </div>
              ))}
            </dl>
            {actions && (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
                {actions.cell(r)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export function FilterTabs<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string; count?: number }[];
}) {
  const num = useNum();
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 scrollbar-none" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:bg-accent",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                value === o.value ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
              )}
            >
              {num(o.count)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 sm:text-sm"
      />
    </div>
  );
}

/** Every destructive or irreversible admin action goes through this. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  confirmLabel,
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc?: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  const tr = useTr();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {desc && <DialogDescription>{desc}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr("বাতিল", "Cancel")}
          </Button>
          <Button
            className={cn(danger && "bg-destructive text-white hover:bg-destructive/90")}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Like ConfirmDialog, but asks for a short reason (kept in the audit trail / shown to the user). */
export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  confirmLabel,
  danger,
  required = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  desc?: string;
  confirmLabel: string;
  danger?: boolean;
  required?: boolean;
  children?: ReactNode;
}) {
  const tr = useTr();
  const [reason, setReason] = useState("");
  const ok = !required || reason.trim().length >= 3;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {desc && <DialogDescription>{desc}</DialogDescription>}
        </DialogHeader>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">
            {tr("কারণ", "Reason")}
            {!required && ` (${tr("ঐচ্ছিক", "optional")})`}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={300}
            className="w-full rounded-xl border bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 sm:text-sm"
          />
        </label>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr("বাতিল", "Cancel")}
          </Button>
          <Button
            disabled={!ok}
            className={cn(danger && "bg-destructive text-white hover:bg-destructive/90")}
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Label + description + switch, used by settings-style forms. */
export function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  children,
}: {
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
        </div>
        <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
      </div>
      {checked && children && <div className="mt-3">{children}</div>}
    </div>
  );
}
