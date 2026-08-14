import type { Notification } from "@/shared/validation";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Info,
  Megaphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useNotifications } from "../../hooks/useNotifications";

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "announcement":
      return <Megaphone className="w-5 h-5 text-blue-500" />;
    default:
      return <Info className="w-5 h-5 text-gray-500" />;
  }
};

const getLink = (notification: Notification) => {
  if (!notification.related_entity_type || !notification.related_entity_id) return "#";
  switch (notification.related_entity_type) {
    case "exchange":
      return `/exchanges/${notification.related_entity_id}`;
    case "conversation":
      return `/messages/${notification.related_entity_id}`;
    case "need_request":
      return `/needs/${notification.related_entity_id}`;
    case "product":
      return `/products/${notification.related_entity_id}`;
    default:
      return "#";
  }
};

export const NotificationCenter = () => {
  const [filter, setFilter] = useState<string>("all");
  const {
    data: result,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    limit: 50,
    is_read: filter === "unread" ? false : undefined,
  });

  const notifications = result?.data || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">Stay updated on your platform activities</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="unread">Unread Only</option>
          </select>

          <button
            type="button"
            onClick={() => markAllAsRead.mutate()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </button>

          <Link
            to="/settings/notifications"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-md px-3 py-1.5"
          >
            Settings
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load notifications. Please try again.
        </div>
      )}

      {!isLoading && !isError && notifications.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
          <p className="text-gray-500 mt-1">You're all caught up!</p>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border flex gap-4 transition-colors ${
              notification.is_read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-100"
            }`}
          >
            <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
            <div className="flex-grow">
              <Link to={getLink(notification)} className="block hover:opacity-80">
                <h4
                  className={`text-sm font-semibold ${notification.is_read ? "text-gray-900" : "text-blue-900"}`}
                >
                  {notification.title}
                </h4>
                <p
                  className={`text-sm mt-1 ${notification.is_read ? "text-gray-600" : "text-blue-800"}`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </Link>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              {!notification.is_read && (
                <button
                  type="button"
                  onClick={() => markAsRead.mutate(notification.id)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteNotification.mutate(notification.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors mt-auto"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
