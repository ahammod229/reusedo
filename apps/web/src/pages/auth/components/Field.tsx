import { cn } from "@/shared/components/ui";
import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, type ReactNode, forwardRef, useId, useState } from "react";

const control =
  "h-12 w-full rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/15 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/15";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const uid = useId();
    const fid = id ?? uid;
    return (
      <div className="space-y-1.5">
        <label htmlFor={fid} className="text-sm font-semibold">
          {label}
        </label>
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${fid}-d` : undefined}
          className={cn(control, className)}
          {...rest}
        />
        {(error || hint) && (
          <p
            id={`${fid}-d`}
            className={cn(
              "text-xs",
              error ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Field.displayName = "Field";

export const PasswordField = forwardRef<
  HTMLInputElement,
  FieldProps & { showLabel: string; hideLabel: string }
>(({ showLabel, hideLabel, ...rest }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field ref={ref} type={show ? "text" : "password"} className="pr-12" {...rest} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? hideLabel : showLabel}
        className="absolute right-2 top-[2.1rem] flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
});
PasswordField.displayName = "PasswordField";

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={cn(control, "appearance-none bg-[length:1rem] disabled:opacity-50")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
    >
      {children}
    </div>
  );
}
