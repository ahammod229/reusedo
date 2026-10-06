import { useNotifications } from "@/features/data/hooks";
import { useNum, useTr } from "@/features/feed/i18n";
import { Bell } from "lucide-react";
import { Link } from "react-router";

/** Header bell with unread count, fed by the data layer (mock now, API later). */
export const NotificationBadge = () => {
  const tr = useTr();
  const num = useNum();
  const { data = [] } = useNotifications();
  const unread = data.filter((n) => n.unread).length;

  return (
    <Link
      to="/notifications"
      aria-label={
        unread
          ? tr(`${num(unread)}টি নতুন নোটিফিকেশন`, `${unread} new notifications`)
          : tr("নোটিফিকেশন", "Notifications")
      }
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground/80 transition-colors hover:bg-accent"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background">
          {unread > 99 ? "99+" : num(unread)}
        </span>
      )}
    </Link>
  );
};
