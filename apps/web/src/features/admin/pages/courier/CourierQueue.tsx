import { useLang, useT } from "@/features/feed/i18n";
import { MOCK_COURIER } from "@/features/feed/mock";
import { type CourierRequestItem, categoryOf } from "@/features/feed/types";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui";
import { useState } from "react";

const TRACKING = () => `SF${Math.floor(10000000 + Math.random() * 89999999)}`;

export function CourierQueue() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const [items, setItems] = useState<(CourierRequestItem & { tracking?: string })[]>(MOCK_COURIER);
  const [open, setOpen] = useState<string | null>(null);
  const sel = items.find((i) => i.id === open);

  const decide = (id: string, status: "confirmed" | "rejected") => {
    // Real flow: confirm → create Steadfast parcel via API, store tracking code, email both users.
    setItems((all) =>
      all.map((i) =>
        i.id === id
          ? { ...i, status, tracking: status === "confirmed" ? TRACKING() : undefined }
          : i,
      ),
    );
    setOpen(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("courierQueue")}</h1>
      <div className="grid gap-3">
        {items.map((i) => (
          <Card key={i.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="text-3xl">{categoryOf(i.category).emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{i.item}</div>
              <div className="text-sm text-muted-foreground">
                {i.giver.address} → {i.receiver.address} · {i.weightKg} কেজি · ৳{i.charge}
              </div>
              <div className="text-xs text-muted-foreground">{i.createdAt}</div>
            </div>
            <Badge
              variant={
                i.status === "pending"
                  ? "secondary"
                  : i.status === "confirmed"
                    ? "default"
                    : "destructive"
              }
            >
              {i.status === "pending"
                ? lang === "bn"
                  ? "অপেক্ষমাণ"
                  : "Pending"
                : i.status === "confirmed"
                  ? "courier_ready"
                  : t("reject")}
            </Badge>
            {i.tracking && (
              <span className="font-mono text-xs">
                {t("tracking")}: {i.tracking}
              </span>
            )}
            {i.status === "pending" && (
              <Button size="sm" onClick={() => setOpen(i.id)}>
                দেখুন
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sel?.item}</DialogTitle>
          </DialogHeader>
          {sel && (
            <div className="space-y-3 text-sm">
              <Party title={t("pickup")} p={sel.giver} />
              <Party title={t("dropoff")} p={sel.receiver} />
              <div className="flex justify-between rounded-lg bg-muted p-3">
                <span>
                  {t("weightApprox")}: {sel.weightKg} কেজি
                </span>
                <span className="font-bold">COD ৳{sel.charge}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => decide(sel.id, "rejected")}
                >
                  {t("reject")}
                </Button>
                <Button className="flex-1" onClick={() => decide(sel.id, "confirmed")}>
                  {t("confirm")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Party({
  title,
  p,
}: { title: string; p: { name: string; phone: string; address: string } }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="font-medium">
        {p.name} · {p.phone}
      </div>
      <div>{p.address}</div>
    </div>
  );
}
