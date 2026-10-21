import { longDate, relTime } from "@/features/data/time";
import { apiClient, isAxiosError } from "@/services/api";
import type { AdminSource } from "./types";

// /api/admin/* (apps/api/src/routes/admin.routes.ts). Roles are checked on the server for
// every call; the admin UI hiding screens is only a convenience. Errors arrive as
// Error(code), e.g. "risk_not_approved", "steadfast_not_configured".

async function call<T>(p: Promise<{ data: { data?: T } }>): Promise<T> {
  try {
    return (await p).data.data as T;
  } catch (e) {
    if (isAxiosError(e)) {
      if (!e.response) throw new Error("network");
      throw new Error((e.response.data as { code?: string })?.code ?? `http_${e.response.status}`);
    }
    throw e;
  }
}

const get = <T>(url: string) => call<T>(apiClient.get(`/admin${url}`));
const send = (method: "post" | "put" | "patch" | "delete", url: string, body?: unknown) =>
  call<void>(
    method === "delete"
      ? apiClient.delete(`/admin${url}`, { data: body })
      : apiClient[method](`/admin${url}`, body),
  ).then(() => undefined);

/** Rewrites ISO timestamps in the given fields to the short labels the screens show. */
function dated<T extends object>(rows: T[], fields: (keyof T)[], fmt = longDate): T[] {
  return rows.map((r) => {
    const out = { ...r };
    for (const f of fields) {
      const v = out[f];
      if (typeof v === "string" && v) (out as Record<keyof T, unknown>)[f] = fmt(v);
    }
    return out;
  });
}

type Of<K extends keyof AdminSource> = Awaited<ReturnType<AdminSource[K]>>;

export const adminApi: AdminSource = {
  stats: () => get("/stats"),

  listUsers: async () => dated(await get<Of<"listUsers">>("/users"), ["joined"]),
  setUserStatus: (id, status) => send("patch", `/users/${id}/status`, { status }),

  listPosts: async () => dated(await get<Of<"listPosts">>("/posts"), ["created"], relTime),
  setPostStatus: (id, status) => send("patch", `/posts/${id}/status`, { status }),

  listExchanges: async () =>
    dated(await get<Of<"listExchanges">>("/exchanges"), ["updated"], relTime),
  cancelExchange: (id) => send("post", `/exchanges/${id}/cancel`),

  listReports: async () => dated(await get<Of<"listReports">>("/reports"), ["created"], relTime),
  setReportStatus: (id, status, hideTarget) =>
    send("patch", `/reports/${id}`, { status, hideTarget }),

  listVerifications: async () =>
    dated(await get<Of<"listVerifications">>("/verifications"), ["created"], relTime),
  decideVerification: (id, status) => send("patch", `/verifications/${id}`, { status }),

  listReviews: async () => dated(await get<Of<"listReviews">>("/reviews"), ["created"], relTime),
  deleteReview: (id) => send("delete", `/reviews/${id}`),

  listCategories: () => get("/categories"),
  saveCategory: (c) =>
    send("put", `/categories/${encodeURIComponent(c.id)}`, {
      bn: c.bn,
      en: c.en,
      emoji: c.emoji,
      enabled: c.enabled,
    }),

  listPages: async () => dated(await get<Of<"listPages">>("/pages"), ["updated"], relTime),
  savePage: (p) =>
    send("put", `/pages/${encodeURIComponent(p.slug)}`, {
      title: p.title,
      body: p.body,
      status: p.status,
    }),

  getSettings: () => get("/settings"),
  saveSettings: (s) => send("put", "/settings", s),

  listFlags: () => get("/flags"),
  setFlag: (key, enabled) => send("patch", `/flags/${encodeURIComponent(key)}`, { enabled }),

  listAudit: async () => dated(await get<Of<"listAudit">>("/audit"), ["when"], relTime),

  listIntegrations: async () => {
    const list = await get<Of<"listIntegrations">>("/integrations");
    return list.map((i) =>
      i.lastCheck ? { ...i, lastCheck: { ...i.lastCheck, at: relTime(i.lastCheck.at) } } : i,
    );
  },
  saveIntegration: ({ id, ...u }) => send("patch", `/integrations/${id}`, u),
  testIntegration: async (id) => {
    const r = await call<Of<"testIntegration">>(apiClient.post(`/admin/integrations/${id}/test`));
    return { ...r, at: relTime(r.at) };
  },

  listPayments: async () => dated(await get<Of<"listPayments">>("/payments"), ["created"], relTime),
  decidePayment: (id, status, note) => send("patch", `/payments/${id}`, { status, note }),
  getPaymentSettings: () => get("/payment-settings"),
  savePaymentSettings: (s) => send("put", "/payment-settings", s),

  listRiskCases: async () => dated(await get<Of<"listRiskCases">>("/risk"), ["created"], relTime),
  decideRisk: (id, status, opts = {}) => send("patch", `/risk/${id}`, { status, ...opts }),
  lookupPhone: (phone) => get(`/risk/phone/${encodeURIComponent(phone)}`),
  listBlocklist: async () => dated(await get<Of<"listBlocklist">>("/blocklist"), ["added"]),
  addBlock: (b) => send("post", "/blocklist", b),
  removeBlock: (id) => send("delete", `/blocklist/${id}`),

  listAds: () => get("/ads"),
  // Ads created in the UI carry a temporary id; the server treats non-UUIDs as new.
  saveAd: ({ id, impressions: _i, clicks: _c, ...a }) =>
    send("put", `/ads/${encodeURIComponent(id)}`, { ...a, image: a.image ?? "", end: a.end ?? "" }),
  deleteAd: (id) => send("delete", `/ads/${id}`),
  getAdNetwork: () => get("/ad-network"),
  saveAdNetwork: (s) => send("put", "/ad-network", s),
};
