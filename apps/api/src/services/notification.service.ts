import { NotificationRepository, SettingsRepository } from "../database";
import type {
  NotificationPreferencesData,
  NotificationPriority,
  NotificationType,
} from "../shared/validation";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { EVENTS, eventBus } from "./event-bus.service";
import { SocketService } from "./socket.service";

// Initialize Firebase Admin gracefully
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin initialized successfully.");
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT not provided. FCM Push Notifications will be mocked.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

export class NotificationService {
  private notificationRepo: NotificationRepository;
  private settingsRepo: SettingsRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
    this.settingsRepo = new SettingsRepository();
    this.setupListeners();
  }

  private setupListeners() {
    eventBus.subscribe(EVENTS.EXCHANGE_REQUESTED, this.handleExchangeRequested.bind(this));
    eventBus.subscribe(EVENTS.EXCHANGE_ACCEPTED, this.handleExchangeAccepted.bind(this));
    eventBus.subscribe(EVENTS.EXCHANGE_REJECTED, this.handleExchangeRejected.bind(this));
    eventBus.subscribe(EVENTS.EXCHANGE_CANCELLED, this.handleExchangeCancelled.bind(this));
    eventBus.subscribe(EVENTS.NEW_MESSAGE, this.handleNewMessage.bind(this));
    eventBus.subscribe(EVENTS.OFFER_SUBMITTED, this.handleOfferSubmitted.bind(this));
    // Add others as needed
  }

  private async dispatch(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    relatedEntityType?: string;
    relatedEntityId?: string;
    preferenceKey?: string; // which preference to check before sending push
  }) {
    try {
      // 1. Insert to Database (always insert unless user explicitly blocked this whole category?
      // Usually preferences are for "push" vs "in-app", we'll assume in-app always shows unless specified.
      // But let's check preferences anyway for push.
      const prefs = await this.settingsRepo
        .getNotificationPreferences(params.userId)
        .catch(() => null);

      const notification = await this.notificationRepo.createNotification({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority,
        related_entity_type: params.relatedEntityType || null,
        related_entity_id: params.relatedEntityId || null,
      });

      // Emit real-time socket event
      SocketService.emitNotification(params.userId, {
        type: "new_notification",
        notification,
      });

      // 2. Check Push Preferences
      let shouldSendPush = true;
      if (prefs) {
        if (!prefs.push_notifications) shouldSendPush = false;

        if (params.preferenceKey) {
          const key = params.preferenceKey as keyof NotificationPreferencesData;
          if (prefs[key] === false) {
            shouldSendPush = false;
          }
        }
      }

      if (shouldSendPush) {
        await this.sendPush(params.userId, params.title, params.message, {
          notificationId: notification.id,
          relatedEntityType: params.relatedEntityType || "",
          relatedEntityId: params.relatedEntityId || "",
        });
      }
    } catch (error) {
      console.error("Error dispatching notification:", error);
    }
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ) {
    try {
      const tokens = await this.notificationRepo.getUserFCMTokens(userId);
      if (!tokens || tokens.length === 0) return;

      if (!getApps().length) {
        console.log(`[MOCK PUSH to ${userId}] ${title}: ${body}`, data);
        return;
      }

      const message = {
        notification: {
          title,
          body,
        },
        data,
        tokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);

      // Cleanup invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        // @ts-ignore: ignoring firebase-admin typing issue
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (
              error?.code === "messaging/invalid-registration-token" ||
              error?.code === "messaging/registration-token-not-registered"
            ) {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        for (const token of failedTokens) {
          await this.notificationRepo.removeFCMToken(userId, token).catch(() => {});
        }
      }
    } catch (error) {
      console.error("Failed to send FCM push:", error);
    }
  }

  // --- Event Handlers ---

  private async handleExchangeRequested(payload: {
    targetUserId: string;
    exchangeId: string;
    requesterName: string;
  }) {
    await this.dispatch({
      userId: payload.targetUserId,
      title: "New Exchange Request",
      message: `${payload.requesterName} wants to exchange with you.`,
      type: "info",
      priority: "high",
      relatedEntityType: "exchange",
      relatedEntityId: payload.exchangeId,
      preferenceKey: "exchange_updates",
    });
  }

  private async handleExchangeAccepted(payload: {
    targetUserId: string;
    exchangeId: string;
    responderName: string;
  }) {
    await this.dispatch({
      userId: payload.targetUserId,
      title: "Exchange Accepted",
      message: `${payload.responderName} accepted your exchange request!`,
      type: "success",
      priority: "high",
      relatedEntityType: "exchange",
      relatedEntityId: payload.exchangeId,
      preferenceKey: "exchange_updates",
    });
  }

  private async handleExchangeRejected(payload: {
    targetUserId: string;
    exchangeId: string;
    responderName: string;
  }) {
    await this.dispatch({
      userId: payload.targetUserId,
      title: "Exchange Rejected",
      message: `${payload.responderName} rejected your exchange request.`,
      type: "warning",
      priority: "normal",
      relatedEntityType: "exchange",
      relatedEntityId: payload.exchangeId,
      preferenceKey: "exchange_updates",
    });
  }

  private async handleExchangeCancelled(payload: {
    targetUserId: string;
    exchangeId: string;
    cancellerName: string;
  }) {
    await this.dispatch({
      userId: payload.targetUserId,
      title: "Exchange Cancelled",
      message: `${payload.cancellerName} cancelled the exchange.`,
      type: "error",
      priority: "high",
      relatedEntityType: "exchange",
      relatedEntityId: payload.exchangeId,
      preferenceKey: "exchange_updates",
    });
  }

  private async handleNewMessage(payload: {
    targetUserId: string;
    conversationId: string;
    senderName: string;
  }) {
    await this.dispatch({
      userId: payload.targetUserId,
      title: "New Message",
      message: `You have a new message from ${payload.senderName}.`,
      type: "info",
      priority: "normal",
      relatedEntityType: "conversation",
      relatedEntityId: payload.conversationId,
      preferenceKey: "messages",
    });
  }

  private async handleOfferSubmitted(payload: {
    targetUserId: string;
    needRequestId: string;
    offererName: string;
  }) {
    await this.dispatch({
      userId: payload.targetUserId,
      title: "New Offer",
      message: `${payload.offererName} submitted an offer for your request.`,
      type: "info",
      priority: "normal",
      relatedEntityType: "need_request",
      relatedEntityId: payload.needRequestId,
      preferenceKey: "need_requests",
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
