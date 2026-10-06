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
};
