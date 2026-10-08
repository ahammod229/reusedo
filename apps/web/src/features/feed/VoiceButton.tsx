import { cn } from "@/shared/components/ui";
import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang, useTr } from "./i18n";

// The browser speech API isn't in TypeScript's DOM lib yet.
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecCtor = new () => SpeechRec;

const ctor = (): SpeechRecCtor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** Dictate into a field in Bangla or English. Renders nothing where the browser can't do it. */
export function VoiceButton({
  onText,
  className,
}: { onText: (text: string) => void; className?: string }) {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const [on, setOn] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  const supported = typeof window !== "undefined" && !!ctor();

  useEffect(() => () => rec.current?.stop(), []);
  if (!supported) return null;

  const toggle = () => {
    if (on) {
      rec.current?.stop();
      return;
    }
    const Rec = ctor();
    if (!Rec) return;
    const r = new Rec();
    r.lang = lang === "bn" ? "bn-BD" : "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((x) => x[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    setOn(true);
    r.start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? tr("থামান", "Stop") : tr("বলে লিখুন", "Speak to type")}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
        on ? "border-destructive bg-destructive/10 text-destructive" : "hover:bg-accent",
        className,
      )}
    >
      {on ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      {on ? tr("শুনছি…", "Listening…") : tr("বলে লিখুন", "Speak")}
    </button>
  );
}
