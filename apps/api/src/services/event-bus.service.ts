import { EventEmitter } from "node:events";

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit if many modules subscribe
    this.setMaxListeners(20);
  }

  // biome-ignore lint/suspicious/noExplicitAny: event bus needs to handle any payload type
  publish(event: string, payload: any) {
    this.emit(event, payload);
  }

  // biome-ignore lint/suspicious/noExplicitAny: event bus needs to handle any payload type
  subscribe(event: string, listener: (...args: any[]) => void) {
    this.on(event, listener);
  }

  // biome-ignore lint/suspicious/noExplicitAny: event bus needs to handle any payload type
  unsubscribe(event: string, listener: (...args: any[]) => void) {
    this.off(event, listener);
  }
}

export const eventBus = new EventBus();

// Define Standard Events
export const EVENTS = {
  EXCHANGE_REQUESTED: "exchange:requested",
  EXCHANGE_ACCEPTED: "exchange:accepted",
  EXCHANGE_REJECTED: "exchange:rejected",
  EXCHANGE_CANCELLED: "exchange:cancelled",
  NEW_MESSAGE: "chat:new_message",
  PRODUCT_PUBLISHED: "product:published",
  PRODUCT_ARCHIVED: "product:archived",
  OFFER_SUBMITTED: "need:offer_submitted",
  REVIEW_RECEIVED: "user:review_received",
  SYSTEM_ANNOUNCEMENT: "system:announcement",
};
