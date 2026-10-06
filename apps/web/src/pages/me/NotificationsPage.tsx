import { useTr } from "@/features/feed/i18n";
import { MOCK_NOTIFICATIONS, type MockNotification } from "@/features/feed/mock";
import { PageHeading } from "@/features/feed/parts";
import { Button, cn } from "@/shared/components/ui";
import { BellRing, CheckCheck, MessageCircle, Search, Star, Truck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

const ICONS = {
  request: UserPlus,
  accepted: CheckCheck,
  message: MessageCircle,
  courier: Truck,
  match: Search,
  review: Star,
};

export function NotificationsPage() {
  const tr = useTr();
  const [items, setItems] = useState<MockNotification[]>(MOCK_NOTIFICATIONS);
  const unread = items.filter((n) => n.unread).length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
      <Helmet>
        <title>{tr("নোটিফিকেশন", "Notifications")} — ReuseDo</title>
      </Helmet>
      <PageHeading
        title={tr("নোটিফিকেশন", "Notifications")}
        sub={unread ? tr(`${unread}টি নতুন`, `${unread} new`) : tr("সব দেখা হয়েছে", "All caught up")}
        action={
          unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItems((a) => a.map((n) => ({ ...n, unread: false })))}
            >
              <CheckCheck className="mr-1.5 h-4 w-4" /> {tr("সব পড়া", "Mark all read")}
            </Button>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <BellRing className="mx-auto mb-3 h-10 w-10" />
          {tr("কোনো নোটিফিকেশন নেই", "No notifications")}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-card">
          {items.map((n) => {
            const Icon = ICONS[n.kind];
            return (
              <li key={n.id} className="border-b last:border-0">
                <Link
                  to={n.href}
                  onClick={() =>
                    setItems((a) => a.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
                  }
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent/60",
                    n.unread && "bg-primary/5",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn("block text-[15px] leading-snug", n.unread && "font-semibold")}
                    >
                      {n.text}
                    </span>
                    <span className="text-xs text-muted-foreground">{n.when}</span>
                  </span>
                  {n.unread && (
                    <span
                      className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                      aria-label={tr("নতুন", "new")}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
