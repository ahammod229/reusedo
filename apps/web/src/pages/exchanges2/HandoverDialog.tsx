import { useConfirmHandover, useHandoverCode } from "@/features/data/hooks";
import type { Exchange } from "@/features/data/types";
import { useNum, useTr } from "@/features/feed/i18n";
import { OtpInput } from "@/pages/auth/components/OtpInput";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

/**
 * In-person handover needs both people: the giver reads out a 4-digit code and the
 * receiver types it in. Neither side can mark the exchange complete alone.
 */
export function HandoverDialog({
  exchange,
  onClose,
}: { exchange: Exchange | null; onClose: () => void }) {
  const tr = useTr();
  const num = useNum();
  const isGiver = exchange?.role === "giver";
  const code = useHandoverCode(exchange && isGiver ? exchange.id : null);
  const confirm = useConfirmHandover();
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  const close = () => {
    setValue("");
    setWrong(false);
    onClose();
  };

  const submit = (v: string) => {
    if (!exchange || v.length !== 4 || confirm.isPending) return;
    confirm.mutate(
      { exchangeId: exchange.id, code: v },
      {
        onSuccess: close,
        onError: () => {
          setWrong(true);
          setValue("");
        },
      },
    );
  };

  return (
    <Dialog open={!!exchange} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {tr("হস্তান্তরের কোড", "Handover code")}
          </DialogTitle>
          <DialogDescription>
            {isGiver
              ? tr(
                  "জিনিস দেওয়ার সময় গ্রহীতাকে এই কোডটি বলুন। তিনি কোড দিলে তবেই আদান-প্রদান সম্পন্ন হবে।",
                  "Tell the receiver this code when you hand the item over. The exchange completes once they enter it.",
                )
              : tr(
                  "জিনিস হাতে পাওয়ার পর দাতার কাছ থেকে ৪ সংখ্যার কোডটি নিয়ে এখানে লিখুন।",
                  "After you receive the item, ask the giver for their 4-digit code and enter it here.",
                )}
          </DialogDescription>
        </DialogHeader>

        {isGiver ? (
          <div className="py-4 text-center">
            <div
              className="text-5xl font-extrabold tracking-[0.3em] text-primary"
              aria-live="polite"
            >
              {code.isLoading ? "••••" : code.data ? num(code.data) : "—"}
            </div>
            {code.isError && (
              <p className="mt-2 text-sm text-destructive">
                {tr("কোড আনা যায়নি। আবার চেষ্টা করুন।", "Couldn't load the code. Try again.")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-2 text-center">
            <OtpInput
              length={4}
              value={value}
              onChange={(v) => {
                setValue(v);
                setWrong(false);
                if (v.length === 4) submit(v);
              }}
              invalid={wrong}
              autoFocus
            />
            <p className="min-h-5 text-sm text-destructive" aria-live="polite">
              {wrong && tr("কোডটি মেলেনি।", "That code doesn't match.")}
            </p>
            <Button
              className="w-full"
              disabled={value.length !== 4 || confirm.isPending}
              onClick={() => submit(value)}
            >
              {tr("পেয়েছি — নিশ্চিত করুন", "I received it — confirm")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
