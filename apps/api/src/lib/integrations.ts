import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getSupabaseClient } from "../database/client";
import { HttpError, badRequest, must } from "./http";
import { getSetting } from "./settings";

// Outside services whose keys an admin sets in Admin → APIs. The catalog (labels,
// which fields are secret) lives here; only values are stored, secrets encrypted.

export type IntegrationId =
  | "gemini"
  | "steadfast"
  | "email"
  | "firebase"
  | "maps"
  | "sms"
  | "bkash"
  | "nagad"
  | "admanager";

interface FieldDef {
  key: string;
  label: string;
  secret: boolean;
  default?: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  optional?: boolean;
  /** Read when nothing is stored, so an env-only setup keeps working. */
  env?: string;
}

interface IntegrationDef {
  id: IntegrationId;
  name: string;
  group: "core" | "payment" | "optional";
  purpose: string;
  docsUrl: string;
  defaultEnabled: boolean;
  modes?: true;
  fields: FieldDef[];
  webhook?: string;
  manageHref?: string;
}

export const CATALOG: IntegrationDef[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    group: "core",
    purpose: "ছবি থেকে পোস্টের শিরোনাম, বিবরণ ও ক্যাটাগরি লেখে; খোঁজার কথা বুঝে মিল খোঁজে",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    defaultEnabled: true,
    fields: [
      { key: "apiKey", label: "API কী", secret: true, placeholder: "AIza…", env: "GEMINI_API_KEY" },
      {
        key: "model",
        label: "মডেল",
        secret: false,
        default: "gemini-2.5-flash",
        hint: "Google AI Studio-তে যে মডেল নাম দেখায় সেটাই দিন",
      },
      {
        key: "searchModel",
        label: "খোঁজার মডেল",
        secret: false,
        default: "gemini-2.5-flash-lite",
        hint: "AI খোঁজ প্রতিবার চলে, তাই দ্রুত ও বেশি ফ্রি কোটার মডেল ভালো",
      },
    ],
  },
  {
    id: "steadfast",
    name: "Steadfast Courier",
    group: "core",
    purpose: "অ্যাডমিন কনফার্ম করলে পার্সেল তৈরি, ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস",
    docsUrl: "https://steadfast.com.bd",
    defaultEnabled: true,
    fields: [
      { key: "apiKey", label: "Api-Key", secret: true, env: "STEADFAST_API_KEY" },
      { key: "secretKey", label: "Secret-Key", secret: true, env: "STEADFAST_SECRET_KEY" },
      {
        key: "baseUrl",
        label: "Base URL",
        secret: false,
        default: "https://portal.packzy.com/api/v1",
        hint: "Steadfast মার্চেন্ট প্যানেলের API ডক থেকে মিলিয়ে নিন",
      },
      {
        key: "webhookToken",
        label: "Webhook Bearer টোকেন",
        secret: true,
        optional: true,
        hint: "Steadfast প্যানেলে webhook-এর Authorization হিসেবে একই টোকেন দিন",
      },
    ],
    webhook: "/api/webhooks/steadfast",
  },
  {
    id: "email",
    name: "ইমেইল (Resend / Brevo)",
    group: "core",
    purpose: "সাইন-আপ কোড, রিকোয়েস্ট ও কুরিয়ার আপডেটের ইমেইল",
    docsUrl: "https://resend.com/docs",
    defaultEnabled: true,
    fields: [
      {
        key: "provider",
        label: "প্রোভাইডার",
        secret: false,
        default: "Resend",
        options: ["Resend", "Brevo"],
      },
      { key: "apiKey", label: "API কী", secret: true, placeholder: "re_…", env: "RESEND_API_KEY" },
      {
        key: "from",
        label: "প্রেরক",
        secret: false,
        default: "ReuseDo <no-reply@reusedo.app>",
        hint: "ডোমেইন প্রোভাইডারে যাচাই (SPF/DKIM) করা থাকতে হবে",
        env: "EMAIL_FROM",
      },
    ],
  },
  {
    id: "firebase",
    name: "Firebase (লগইন ও পুশ)",
    group: "core",
    purpose: "লগইন টোকেন যাচাই ও অ্যাপে পুশ নোটিফিকেশন (FCM)",
    docsUrl: "https://firebase.google.com/docs/admin/setup",
    defaultEnabled: true,
    fields: [
      {
        key: "projectId",
        label: "Project ID",
        secret: false,
        placeholder: "reusedo-xxxx",
        env: "FIREBASE_PROJECT_ID",
      },
      {
        key: "serviceAccount",
        label: "সার্ভিস অ্যাকাউন্ট JSON",
        secret: true,
        hint: "ওয়েবের Firebase কনফিগ বিল্ডের সময় VITE_ ভেরিয়েবলে যায়, এখানে নয়",
      },
    ],
  },
  {
    id: "maps",
    name: "ম্যাপ (Barikoi / Google)",
    group: "core",
    purpose: "ঠিকানা যাচাই, এলাকা খোঁজা ও দূরত্ব হিসাব",
    docsUrl: "https://docs.barikoi.com",
    defaultEnabled: true,
    fields: [
      {
        key: "provider",
        label: "প্রোভাইডার",
        secret: false,
        default: "Barikoi",
        options: ["Barikoi", "Google Maps"],
      },
      { key: "apiKey", label: "API কী", secret: true },
    ],
  },
  {
    id: "bkash",
    name: "bKash পেমেন্ট গেটওয়ে",
    group: "payment",
    purpose: "কুরিয়ার চার্জ আগাম নেওয়া (স্বয়ংক্রিয় যাচাই)। না থাকলে TrxID দেখে হাতে যাচাই।",
    docsUrl: "https://developer.bka.sh",
    defaultEnabled: false,
    modes: true,
    fields: [
      { key: "appKey", label: "App Key", secret: true },
      { key: "appSecret", label: "App Secret", secret: true },
      { key: "username", label: "Username", secret: true },
      { key: "password", label: "Password", secret: true },
    ],
    webhook: "/api/payments/bkash/callback",
  },
  {
    id: "nagad",
    name: "Nagad পেমেন্ট গেটওয়ে",
    group: "payment",
    purpose: "Nagad দিয়ে কুরিয়ার চার্জ আগাম নেওয়া",
    docsUrl: "https://nagad.com.bd",
    defaultEnabled: false,
    modes: true,
    fields: [
      { key: "merchantId", label: "Merchant ID", secret: false },
      { key: "privateKey", label: "Merchant Private Key", secret: true },
      { key: "publicKey", label: "Nagad PG Public Key", secret: true },
    ],
    webhook: "/api/payments/nagad/callback",
  },
  {
    id: "sms",
    name: "SMS",
    group: "optional",
    purpose: "ডেলিভারির দিন গ্রহীতাকে SMS (ঐচ্ছিক)",
    docsUrl: "https://bulksmsbd.com",
    defaultEnabled: false,
    fields: [
      {
        key: "provider",
        label: "প্রোভাইডার",
        secret: false,
        default: "BulkSMSBD",
        options: ["BulkSMSBD", "SSL Wireless", "Alpha SMS"],
      },
      { key: "apiKey", label: "API কী", secret: true },
      { key: "senderId", label: "Sender ID", secret: false, optional: true },
    ],
  },
  {
    id: "admanager",
    name: "Google Ad Manager (AdX)",
    group: "optional",
    purpose: "ফিডের বিজ্ঞাপনের জায়গা Google দিয়ে পূরণ",
    docsUrl: "https://support.google.com/admanager",
    defaultEnabled: true,
    manageHref: "/admin/ads",
    fields: [],
  },
];

const def = (id: string) => {
  const d = CATALOG.find((c) => c.id === id);
  if (!d) throw badRequest("unknown_integration");
  return d;
};

// --- encryption -------------------------------------------------------------

function masterKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  const key = raw ? Buffer.from(raw, "base64") : null;
  if (!key || key.length !== 32) {
    throw new HttpError(
      503,
      "encryption_key_missing",
      "SETTINGS_ENCRYPTION_KEY must be 32 bytes, base64",
    );
  }
  return key;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", masterKey(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString("base64")).join(".");
}

export function decrypt(blob: string): string {
  const [iv, tag, body] = blob.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", masterKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(body), d.final()]).toString("utf8");
}

// --- reading ----------------------------------------------------------------

interface Row {
  id: string;
  enabled: boolean;
  mode: "sandbox" | "live" | null;
  public_values: Record<string, string>;
  secret_values: Record<string, { c: string; last4: string }>;
  last_check: { ok: boolean; ms: number; message: string; at: string } | null;
}

async function rows(): Promise<Map<string, Row>> {
  const list = must(await getSupabaseClient().from("integration_settings").select("*")) as Row[];
  return new Map(list.map((r) => [r.id, r]));
}

/** Plain values a server feature uses (decrypted). Stored value → env → default. */
export async function integration(id: IntegrationId) {
  const d = def(id);
  const row = (await rows()).get(id);
  const values: Record<string, string | undefined> = {};
  for (const f of d.fields) {
    const stored = f.secret ? row?.secret_values[f.key]?.c : row?.public_values[f.key];
    values[f.key] = stored
      ? f.secret
        ? decrypt(stored)
        : stored
      : (f.env && process.env[f.env]) || f.default;
  }
  return {
    enabled: row?.enabled ?? d.defaultEnabled,
    mode: row?.mode ?? (d.modes ? "sandbox" : undefined),
    values,
  };
}

/** What Admin → APIs shows. Secrets never leave: only whether set, and the last 4. */
export async function listForAdmin() {
  const map = await rows();
  return CATALOG.map((d) => {
    const row = map.get(d.id);
    return {
      id: d.id,
      name: d.name,
      group: d.group,
      purpose: d.purpose,
      docsUrl: d.docsUrl,
      enabled: row?.enabled ?? d.defaultEnabled,
      ...(d.modes && { mode: row?.mode ?? "sandbox" }),
      fields: d.fields.map((f) => {
        const envVal = f.env ? process.env[f.env] : undefined;
        if (f.secret) {
          const s = row?.secret_values[f.key];
          const last4 = s?.last4 ?? (envVal ? envVal.slice(-4) : undefined);
          return {
            key: f.key,
            label: f.label,
            secret: true,
            set: !!(s || envVal),
            last4,
            placeholder: f.placeholder,
            hint: f.hint ?? (!s && envVal ? `env ${f.env} থেকে` : undefined),
            optional: f.optional,
          };
        }
        const value = row?.public_values[f.key] ?? envVal ?? f.default;
        return {
          key: f.key,
          label: f.label,
          secret: false,
          set: !!value,
          value,
          placeholder: f.placeholder,
          hint: f.hint,
          options: f.options,
          optional: f.optional,
        };
      }),
      webhook: d.webhook,
      manageHref: d.manageHref,
      lastCheck: row?.last_check ?? undefined,
    };
  });
}

export async function saveIntegration(
  u: { id: string; enabled?: boolean; mode?: "sandbox" | "live"; values?: Record<string, string> },
  by: string,
) {
  const d = def(u.id);
  const row = (await rows()).get(d.id);
  const pub = { ...(row?.public_values ?? {}) };
  const sec = { ...(row?.secret_values ?? {}) };
  let changedKeys = false;
  for (const [k, v] of Object.entries(u.values ?? {})) {
    const f = d.fields.find((x) => x.key === k);
    if (!f) throw badRequest("unknown_field", k);
    if (f.options && v && !f.options.includes(v)) throw badRequest("invalid_option", k);
    changedKeys = true;
    // An empty string clears the field.
    if (f.secret) {
      if (v) sec[k] = { c: encrypt(v), last4: v.slice(-4) };
      else delete sec[k];
    } else if (v) pub[k] = v.trim();
    else delete pub[k];
  }
  must(
    await getSupabaseClient()
      .from("integration_settings")
      .upsert({
        id: d.id,
        enabled: u.enabled ?? row?.enabled ?? d.defaultEnabled,
        mode: d.modes ? (u.mode ?? row?.mode ?? "sandbox") : null,
        public_values: pub,
        secret_values: sec,
        // New keys haven't been tested yet.
        last_check: changedKeys ? null : (row?.last_check ?? null),
        updated_by: by,
        updated_at: new Date().toISOString(),
      }),
  );
  // Which fields changed, never their values (for the audit log).
  return Object.keys(u.values ?? {});
}

// --- live checks ------------------------------------------------------------

async function probe(
  url: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  return { ok: res.ok, message: res.ok ? "OK" : `HTTP ${res.status}` };
}

export async function testIntegration(id: IntegrationId) {
  const { values: v } = await integration(id);
  const started = Date.now();
  let result: { ok: boolean; message: string };
  const missing = def(id)
    .fields.filter((f) => !f.optional && !v[f.key])
    .map((f) => f.label);
  try {
    if (missing.length) result = { ok: false, message: `বাকি: ${missing.join(", ")}` };
    else if (id === "gemini")
      result = await probe(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(v.apiKey ?? "")}`,
      );
    else if (id === "steadfast")
      result = await probe(`${v.baseUrl}/get_balance`, {
        headers: { "Api-Key": v.apiKey ?? "", "Secret-Key": v.secretKey ?? "" },
      });
    else if (id === "email")
      result =
        v.provider === "Brevo"
          ? await probe("https://api.brevo.com/v3/account", {
              headers: { "api-key": v.apiKey ?? "" },
            })
          : await probe("https://api.resend.com/domains", {
              headers: { Authorization: `Bearer ${v.apiKey}` },
            });
    else if (id === "maps")
      result =
        v.provider === "Google Maps"
          ? await probe(
              `https://maps.googleapis.com/maps/api/geocode/json?address=Dhaka&key=${encodeURIComponent(v.apiKey ?? "")}`,
            )
          : await probe(
              `https://barikoi.xyz/v2/api/search/autocomplete?api_key=${encodeURIComponent(v.apiKey ?? "")}&q=dhaka`,
            );
    else if (id === "firebase") {
      if (v.serviceAccount) JSON.parse(v.serviceAccount);
      result = {
        ok: true,
        message: v.serviceAccount ? "JSON ঠিক আছে" : "Project ID আছে (সার্ভিস অ্যাকাউন্ট ছাড়া)",
      };
    } else if (id === "admanager") {
      const ad = await getSetting<{ networkCode: string }>("ad_network");
      result = ad.networkCode
        ? { ok: true, message: `Network ${ad.networkCode}` }
        : { ok: false, message: "Network code বাকি" };
    } else {
      // Payment gateways and SMS need a merchant flow to test; confirm the keys are present.
      result = { ok: true, message: "কী আছে — স্বয়ংক্রিয় যাচাই নেই, প্রথম লেনদেনে দেখুন" };
    }
  } catch (e) {
    result = { ok: false, message: e instanceof Error ? e.message : "failed" };
  }
  const check = { ...result, ms: Date.now() - started, at: new Date().toISOString() };
  const d = def(id);
  const existing = (await rows()).get(id);
  must(
    await getSupabaseClient()
      .from("integration_settings")
      .upsert({
        id,
        enabled: existing?.enabled ?? d.defaultEnabled,
        mode: existing?.mode ?? (d.modes ? "sandbox" : null),
        public_values: existing?.public_values ?? {},
        secret_values: existing?.secret_values ?? {},
        last_check: check,
        updated_at: new Date().toISOString(),
      }),
  );
  return check;
}
