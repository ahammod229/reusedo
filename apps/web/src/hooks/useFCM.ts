import { app } from "@/features/auth";
import { NotificationService } from "@/services/api";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { useEffect, useState } from "react";

export function useFCM() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  useEffect(() => {
    let unsubscribe = () => {};

    const setupFCM = async () => {
      try {
        const supported = await isSupported();
        if (!supported) return;

        const messaging = getMessaging(app);

        // Listen for foreground messages
        unsubscribe = onMessage(messaging, (payload) => {
          // In a real app, you might want to show a toast or local notification here.
          // Since our realtime hook will also pick up the DB insert, we don't necessarily
          // need to mutate state here, but we could trigger a toast.
          console.log("Foreground FCM message received:", payload);
          // Optional: trigger browser Notification if document is hidden
          if (document.hidden && payload.notification) {
            new Notification(payload.notification.title || "Notification", {
              body: payload.notification.body,
              icon: "/favicon.ico",
            });
          }
        });
      } catch (err) {
        console.error("Failed to set up FCM:", err);
      }
    };

    setupFCM();
    return () => unsubscribe();
  }, []);

  const requestPermission = async () => {
    try {
      if (typeof Notification === "undefined") return;

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setHasPermission(true);
        await registerToken();
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const registerToken = async () => {
    try {
      const supported = await isSupported();
      if (!supported) return;

      const messaging = getMessaging(app);

      const vapidKey =
        (import.meta as unknown as { env: { VITE_FIREBASE_VAPID_KEY: string } }).env
          .VITE_FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.warn("VITE_FIREBASE_VAPID_KEY not provided. FCM Token registration skipped.");
        return;
      }

      const token = await getToken(messaging, { vapidKey });

      if (token) {
        setFcmToken(token);
        await NotificationService.registerFCMToken(token, navigator.userAgent);
      }
    } catch (error) {
      console.error("Failed to register FCM token:", error);
    }
  };

  return {
    fcmToken,
    hasPermission,
    requestPermission,
    registerToken,
  };
}
