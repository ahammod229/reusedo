import { cn } from "@/shared/components/ui";
import { type ClipboardEvent, type KeyboardEvent, useRef } from "react";

const LEN = 6;
const toLatin = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

/** Six single-digit boxes; supports paste, backspace, arrows, Bengali digits and SMS/email autofill. */
export function OtpInput({
  value,
  onChange,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LEN }, (_, i) => value[i] ?? "");

  const set = (i: number, raw: string) => {
    const d = toLatin(raw).replace(/\D/g, "");
    if (!d) return;
    const next = value.padEnd(LEN, " ").split("");
    let k = i;
    for (const ch of d) {
      if (k >= LEN) break;
      next[k++] = ch;
    }
    onChange(next.join("").replace(/ /g, "").slice(0, LEN));
    refs.current[Math.min(k, LEN - 1)]?.focus();
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.split("");
      if (next[i]) next[i] = "";
      else if (i > 0) {
        next[i - 1] = "";
        refs.current[i - 1]?.focus();
      }
      onChange(next.join(""));
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    set(0, e.clipboardData.getData("text"));
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional inputs
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          // biome-ignore lint/a11y/noAutofocus: the code box is the only task on the verify screen
          autoFocus={autoFocus && i === 0}
          maxLength={LEN}
          aria-label={`${i + 1}/${LEN}`}
          aria-invalid={invalid}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-11 rounded-xl border bg-background text-center text-2xl font-bold outline-none transition-all sm:h-16 sm:w-13",
            "focus:border-primary focus:ring-4 focus:ring-primary/15",
            d && "border-primary/60 bg-primary/5",
            invalid && "border-destructive bg-destructive/5 animate-[shake_.3s]",
          )}
        />
      ))}
    </div>
  );
}
