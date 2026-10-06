import type { AdminSource } from "./types";

// Existing endpoints are noted; "NEW" means apps/api still needs the route.
// Roles in apps/api: super_admin | admin | moderator (requireAdmin([...])).
const todo = (what: string) => async (): Promise<never> => {
  throw new Error(`Admin API not connected yet: ${what}`);
};

export const adminApi: AdminSource = {
  stats: todo("GET /api/admin/dashboard/metrics (extend: series, byCategory, topDistricts, ads)"),
  listUsers: todo("GET /api/admin/users"),
  setUserStatus: todo("PATCH /api/admin/users/:id/status"),
  listPosts: todo("GET /api/admin/products + /api/admin/needs (merge into one list)"),
  setPostStatus: todo(
    "PATCH /api/admin/products/:id/status | /needs/:id/status; DELETE for 'deleted'",
  ),
  listExchanges: todo("GET /api/admin/exchanges"),
  cancelExchange: todo("PATCH /api/admin/exchanges/:id/status (cancelled)"),
  listReports: todo("GET /api/reports (admin scope)"),
  setReportStatus: todo("NEW PATCH /api/admin/reports/:id (status, hideTarget)"),
  listVerifications: todo("NEW GET /api/admin/verifications (flagged accounts only)"),
  decideVerification: todo("PATCH /api/verifications/:id/status"),
  listReviews: todo("NEW GET /api/admin/reviews"),
  deleteReview: todo("NEW DELETE /api/admin/reviews/:id"),
  listCategories: todo("GET /api/categories (+ NEW admin write routes)"),
  saveCategory: todo("NEW POST|PATCH /api/admin/categories"),
  listPages: todo("GET /api/admin/cms"),
  savePage: todo("POST|PATCH /api/admin/cms"),
  getSettings: todo("GET /api/admin/settings"),
  saveSettings: todo("PATCH /api/admin/settings (super_admin)"),
  listFlags: todo("GET /api/admin/feature-flags"),
  setFlag: todo("PATCH /api/admin/feature-flags/:key (super_admin)"),
  listAudit: todo("GET /api/admin/audit-logs"),

  // Integrations: secrets stored AES-256-GCM encrypted (key from SETTINGS_ENCRYPTION_KEY env),
  // never returned — responses carry only { set, last4 }. super_admin only.
  listIntegrations: todo("NEW GET /api/admin/integrations"),
  saveIntegration: todo("NEW PATCH /api/admin/integrations/:id (super_admin, re-auth)"),
  testIntegration: todo("NEW POST /api/admin/integrations/:id/test (server calls the provider)"),

  listPayments: todo("NEW GET /api/admin/payments"),
  decidePayment: todo(
    "NEW PATCH /api/admin/payments/:id (verified|rejected|refunded|cod_collected)",
  ),
  getPaymentSettings: todo("NEW GET /api/admin/payment-settings"),
  savePaymentSettings: todo("NEW PATCH /api/admin/payment-settings"),

  listRiskCases: todo("NEW GET /api/admin/risk (score computed server-side on request create)"),
  decideRisk: todo("NEW PATCH /api/admin/risk/:id (approved|held|rejected, blockPhone)"),
  lookupPhone: todo("NEW GET /api/admin/risk/phone/:phone (own history + courier history)"),
  listBlocklist: todo("NEW GET /api/admin/blocklist"),
  addBlock: todo("NEW POST /api/admin/blocklist"),
  removeBlock: todo("NEW DELETE /api/admin/blocklist/:id"),

  listAds: todo("NEW GET /api/admin/ads"),
  saveAd: todo("NEW POST|PATCH /api/admin/ads (image via signed upload)"),
  deleteAd: todo("NEW DELETE /api/admin/ads/:id"),
  getAdNetwork: todo("NEW GET /api/admin/ad-network"),
  saveAdNetwork: todo("NEW PATCH /api/admin/ad-network"),
};
