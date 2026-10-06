import type { DataSource } from "./types";

// Each method below maps to a real endpoint. Implement them one by one (see
// docs/BUILD_GUIDE.md §5); TypeScript will keep the contract in sync with the UI.
// Existing backend routes are noted per method; "NEW" means the backend still
// needs to be written.
const todo = (what: string) => async (): Promise<never> => {
  throw new Error(`API not connected yet: ${what}`);
};

export const apiSource: DataSource = {
  listFeed: todo("GET /api/feed (NEW — merge products + needs, rank by area)"),
  getPost: todo("GET /api/products/:id or /api/needs/:id"),
  publishPost: todo(
    "POST /api/products | /api/needs, then POST /api/products/:id/images, then /publish",
  ),
  aiDraft: todo("POST /api/ai/draft (NEW — server-side Gemini, per-user daily cap)"),

  listChats: todo("GET /api/chat/conversations"),
  sendMessage: todo("POST /api/chat/conversations/:id/messages"),

  listExchanges: todo("GET /api/exchanges/incoming + /outgoing + /history"),
  advanceExchange: todo("POST /api/exchanges/:id/accept | status transitions"),

  listNotifications: todo("GET /api/notifications"),
  markNotificationRead: todo("PATCH /api/notifications/:id/read | POST /read-all"),

  getUser: todo("GET /api/users/:username"),

  listCourierRequests: todo("GET /api/admin/courier-requests (NEW)"),
  decideCourierRequest: todo(
    "POST /api/admin/courier-requests/:id/confirm|reject (NEW — creates Steadfast parcel)",
  ),
};
