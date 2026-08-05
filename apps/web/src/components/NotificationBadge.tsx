import { useAuthStore } from "@reusedo/auth";
import { Bell } from "lucide-react";
import { Link } from "react-router";
import { useNotificationRealtime } from "../hooks/useNotificationRealtime";
import { useUnreadNotificationCount } from "../hooks/useNotifications";

export const NotificationBadge = () => {
  const user = useAuthStore((state) => state.user);

  // Realtime listener initialized here globally for the app header
  useNotificationRealtime(user?.uid);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <Link
      to="/notifications"
      className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};
