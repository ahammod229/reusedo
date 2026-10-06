import { store } from "@/features/data/platformStore";
import { isBdMobile, normalizePhone } from "@/features/geo/bd";
import { addressSignals, historySignal, phoneSignal } from "../risk";
import type {
  AdminRiskCase,
  AdminSource,
  BlockEntry,
  CourierHistory,
  Integration,
  RiskSignal,
} from "./types";

// Mock for integrations, payments, fraud checks and the ads manager.
// Secrets are never kept here, not even in memory: only last4 and a validity bit.

type Log = (action: string, target: string) => void;
type Wait = <T>(v: T, ms?: number) => Promise<T>;

const now = () => new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

const integrations: Integration[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    group: "core",
    purpose: "ছবি থেকে পোস্টের শিরোনাম, বিবরণ ও ক্যাটাগরি লেখে",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    enabled: true,
    fields: [
      { key: "apiKey", label: "API কী", secret: true, set: false, placeholder: "AIza…" },
      {
        key: "model",
        label: "মডেল",
        secret: false,
        set: true,
        value: "gemini-2.5-flash",
        hint: "Google AI Studio-তে যে মডেল নাম দেখায় সেটাই দিন",
      },
    ],
    usage: { label: "আজকের AI ড্রাফট", used: 0, limit: 1000 },
  },
  {
    id: "steadfast",
    name: "Steadfast Courier",
    group: "core",
    purpose: "অ্যাডমিন কনফার্ম করলে পার্সেল তৈরি, ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস",
    docsUrl: "https://steadfast.com.bd",
    enabled: true,
    fields: [
      { key: "apiKey", label: "Api-Key", secret: true, set: false },
      { key: "secretKey", label: "Secret-Key", secret: true, set: false },
      {
        key: "baseUrl",
        label: "Base URL",
        secret: false,
        set: true,
        value: "https://portal.packzy.com/api/v1",
        hint: "Steadfast মার্চেন্ট প্যানেলের API ডক থেকে মিলিয়ে নিন",
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
    enabled: true,
    fields: [
      {
        key: "provider",
        label: "প্রোভাইডার",
        secret: false,
        set: true,
        value: "Resend",
        options: ["Resend", "Brevo"],
      },
      { key: "apiKey", label: "API কী", secret: true, set: false, placeholder: "re_…" },
      {
        key: "from",
        label: "প্রেরক",
        secret: false,
        set: true,
        value: "ReuseDo <no-reply@reusedo.app>",
        hint: "ডোমেইন প্রোভাইডারে যাচাই (SPF/DKIM) করা থাকতে হবে",
      },
    ],
  },
  {
    id: "firebase",
    name: "Firebase (লগইন ও পুশ)",
    group: "core",
    purpose: "লগইন টোকেন যাচাই ও অ্যাপে পুশ নোটিফিকেশন (FCM)",
    docsUrl: "https://firebase.google.com/docs/admin/setup",
    enabled: true,
    fields: [
      {
        key: "projectId",
        label: "Project ID",
        secret: false,
        set: false,
        placeholder: "reusedo-xxxx",
      },
      {
        key: "serviceAccount",
        label: "সার্ভিস অ্যাকাউন্ট JSON",
        secret: true,
        set: false,
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
    enabled: true,
    fields: [
      {
        key: "provider",
        label: "প্রোভাইডার",
        secret: false,
        set: true,
        value: "Barikoi",
        options: ["Barikoi", "Google Maps"],
      },
      { key: "apiKey", label: "API কী", secret: true, set: false },
    ],
  },
  {
    id: "bkash",
    name: "bKash পেমেন্ট গেটওয়ে",
    group: "payment",
    purpose: "কুরিয়ার চার্জ আগাম নেওয়া (স্বয়ংক্রিয় যাচাই)। না থাকলে TrxID দেখে হাতে যাচাই।",
    docsUrl: "https://developer.bka.sh",
    enabled: false,
    mode: "sandbox",
    fields: [
      { key: "appKey", label: "App Key", secret: true, set: false },
      { key: "appSecret", label: "App Secret", secret: true, set: false },
      { key: "username", label: "Username", secret: true, set: false },
      { key: "password", label: "Password", secret: true, set: false },
    ],
    webhook: "/api/payments/bkash/callback",
  },
  {
    id: "nagad",
    name: "Nagad পেমেন্ট গেটওয়ে",
    group: "payment",
    purpose: "Nagad দিয়ে কুরিয়ার চার্জ আগাম নেওয়া",
    docsUrl: "https://nagad.com.bd",
    enabled: false,
    mode: "sandbox",
    fields: [
      { key: "merchantId", label: "Merchant ID", secret: false, set: false },
      { key: "privateKey", label: "Merchant Private Key", secret: true, set: false },
      { key: "publicKey", label: "Nagad PG Public Key", secret: true, set: false },
    ],
    webhook: "/api/payments/nagad/callback",
  },
  {
    id: "sms",
    name: "SMS",
    group: "optional",
    purpose: "ডেলিভারির দিন গ্রহীতাকে SMS (ঐচ্ছিক)",
    docsUrl: "https://bulksmsbd.com",
    enabled: false,
    fields: [
      {
        key: "provider",
        label: "প্রোভাইডার",
        secret: false,
        set: true,
        value: "BulkSMSBD",
        options: ["BulkSMSBD", "SSL Wireless", "Alpha SMS"],
      },
      { key: "apiKey", label: "API কী", secret: true, set: false },
      { key: "senderId", label: "Sender ID", secret: false, set: false, optional: true },
    ],
  },
  {
    id: "admanager",
    name: "Google Ad Manager (AdX)",
    group: "optional",
    purpose: "ফিডের বিজ্ঞাপনের জায়গা Google দিয়ে পূরণ",
    docsUrl: "https://support.google.com/admanager",
    enabled: true,
    manageHref: "/admin/ads",
    fields: [],
  },
];

/** Whether each stored secret would be accepted — stands in for the provider's answer. */
const secretOk = new Map<string, boolean>();

const syncAdManager = () => {
  const i = integrations.find((x) => x.id === "admanager");
  if (!i) return;
  const code = store.adSettings.networkCode;
  i.enabled = store.adSettings.adxEnabled;
  i.fields = [
    { key: "networkCode", label: "Network code", secret: false, set: !!code, value: code },
  ];
};

// ---- Fraud / risk ----

const blocklist: BlockEntry[] = [
  {
    id: "b1",
    type: "phone",
    value: "01999-111222",
    reason: "ভুয়া bKash TrxID দিয়েছে",
    added: "গত সপ্তাহ",
  },
  { id: "b2", type: "email", value: "@tempmail.xyz", reason: "অস্থায়ী ইমেইল ডোমেইন", added: "গত মাস" },
];

const HISTORY: Record<string, CourierHistory> = {
  "01811000002": { total: 12, delivered: 11, returned: 1, source: "Steadfast" },
  "01611000004": { total: 6, delivered: 4, returned: 2, source: "Steadfast" },
  "01311000006": { total: 3, delivered: 3, returned: 0, source: "Steadfast" },
  "0199999999": { total: 5, delivered: 1, returned: 4, source: "Steadfast" },
};
const ACCOUNTS: Record<string, string[]> = {
  "01611000004": ["সুমাইয়া আক্তার", "sumi.a (অন্য অ্যাকাউন্ট)"],
};

const isBlocked = (type: BlockEntry["type"], v: string) =>
  blocklist.some((b) =>
    b.type !== type
      ? false
      : type === "phone"
        ? normalizePhone(b.value) === normalizePhone(v)
        : v.toLowerCase().includes(b.value.toLowerCase()),
  );

type Seed = Omit<AdminRiskCase, "signals" | "history"> & {
  emailVerified: boolean;
  requests24h: number;
  reports: number;
};

function signalsFor(c: Seed): { signals: RiskSignal[]; history: CourierHistory | null } {
  const p = normalizePhone(c.phone);
  const history = HISTORY[p] ?? null;
  const others = ACCOUNTS[p]?.length ?? 1;
  const blocked = isBlocked("phone", c.phone) || isBlocked("email", c.email);
  const signals: RiskSignal[] = [
    {
      key: "blocklist",
      label: "ব্লকলিস্ট",
      detail: blocked ? "ফোন বা ইমেইল ব্লকলিস্টে আছে" : "পরিষ্কার",
      result: blocked ? "fail" : "pass",
      weight: 100,
    },
    {
      key: "email",
      label: "ইমেইল যাচাই করা",
      detail: c.emailVerified ? c.email : `${c.email} — কোড দিয়ে যাচাই হয়নি`,
      result: c.emailVerified ? "pass" : "fail",
      weight: 15,
    },
    phoneSignal(c.phone),
    {
      key: "shared",
      label: "নম্বর একটি অ্যাকাউন্টেই",
      detail: others > 1 ? `${others}টি অ্যাকাউন্টে এই নম্বর` : "শুধু এই অ্যাকাউন্টে",
      result: others > 1 ? "warn" : "pass",
      weight: 20,
    },
    {
      key: "age",
      label: "অ্যাকাউন্টের বয়স",
      detail: `${c.accountAgeDays} দিন`,
      result: c.accountAgeDays >= 14 ? "pass" : c.accountAgeDays >= 3 ? "warn" : "fail",
      weight: 10,
    },
    {
      key: "velocity",
      label: "গত ২৪ ঘণ্টার রিকোয়েস্ট",
      detail: `${c.requests24h}টি`,
      result: c.requests24h <= 2 ? "pass" : c.requests24h <= 5 ? "warn" : "fail",
      weight: 20,
    },
    ...addressSignals(c.address),
    historySignal(history),
    {
      key: "reports",
      label: "রিপোর্ট",
      detail: c.reports ? `${c.reports}টি রিপোর্ট` : "কোনো রিপোর্ট নেই",
      result: c.reports === 0 ? "pass" : c.reports < 3 ? "warn" : "fail",
      weight: 20,
    },
  ];
  return { signals, history };
}

const seeds: Seed[] = [
  {
    id: "k1",
    courierId: "c1",
    item: "ক্লাস ৮-এর সব বই (সেট)",
    user: "ফাহিম রহমান",
    phone: "01811-000002",
    email: "fahim@example.com",
    address: { district: "সিলেট", thana: "কোতোয়ালি", line: "বাসা ১২, রোড ৩, জিন্দাবাজার" },
    accountAgeDays: 180,
    emailVerified: true,
    requests24h: 1,
    reports: 0,
    status: "open",
    created: "আজ, ১০:২০",
  },
  {
    id: "k2",
    courierId: "c2",
    item: "শিশুর শীতের জামা",
    user: "সুমাইয়া আক্তার",
    phone: "01611-000004",
    email: "sumaiya@example.com",
    address: { district: "ঢাকা", thana: "উত্তরা", line: "সেক্টর ৪" },
    accountAgeDays: 230,
    emailVerified: true,
    requests24h: 4,
    reports: 0,
    status: "open",
    created: "গতকাল, ১৬:০৫",
  },
  {
    id: "k3",
    item: "পুরনো ল্যাপটপ",
    user: "অজানা ইউজার",
    phone: "0199999999",
    email: "x9@tempmail.xyz",
    address: { district: "ঢাকা শহর", thana: "", line: "ঢাকা" },
    accountAgeDays: 1,
    emailVerified: false,
    requests24h: 9,
    reports: 2,
    status: "open",
    created: "আজ, ০৯:১০",
  },
  {
    id: "k4",
    courierId: "c3",
    item: "কাঠের বুকশেলফ",
    user: "তানভীর আহমেদ",
    phone: "01311-000006",
    email: "tanvir@example.com",
    address: { district: "ঢাকা", thana: "ধানমন্ডি", line: "বাড়ি ৭, রোড ১৫, ধানমন্ডি" },
    accountAgeDays: 200,
    emailVerified: true,
    requests24h: 1,
    reports: 0,
    status: "approved",
    created: "২ দিন আগে",
  },
];
const riskSeeds = new Map(seeds.map((s) => [s.id, s]));
const cases = new Map(seeds.map((s) => [s.id, { status: s.status, note: s.note }]));

/** Cases are rebuilt on every read so blocklist changes show up immediately. */
const buildCases = (): AdminRiskCase[] =>
  seeds.map((s) => {
    const { emailVerified: _e, requests24h: _r, reports: _p, ...base } = s;
    return { ...base, ...cases.get(s.id), ...signalsFor(s) };
  });

const OPERATORS: Record<string, string> = {
  "013": "Grameenphone",
  "017": "Grameenphone",
  "014": "Banglalink",
  "019": "Banglalink",
  "015": "Teletalk",
  "016": "Robi (Airtel)",
  "018": "Robi",
};

export const openRiskCount = () => [...cases.values()].filter((c) => c.status === "open").length;

export function extraMock(log: Log, wait: Wait) {
  syncAdManager();
  const ops: Pick<
    AdminSource,
    | "listIntegrations"
    | "saveIntegration"
    | "testIntegration"
    | "listPayments"
    | "decidePayment"
    | "getPaymentSettings"
    | "savePaymentSettings"
    | "listRiskCases"
    | "decideRisk"
    | "lookupPhone"
    | "listBlocklist"
    | "addBlock"
    | "removeBlock"
    | "listAds"
    | "saveAd"
    | "deleteAd"
    | "getAdNetwork"
    | "saveAdNetwork"
  > = {
    listIntegrations: () => {
      syncAdManager();
      return wait(integrations);
    },
    async saveIntegration({ id, enabled, mode, values = {} }) {
      const i = integrations.find((x) => x.id === id);
      if (!i) throw new Error("not_found");
      if (enabled !== undefined) i.enabled = enabled;
      if (mode) i.mode = mode;
      let touched = false;
      for (const [k, v] of Object.entries(values)) {
        const f = i.fields.find((x) => x.key === k);
        if (!f) continue;
        touched = true;
        const val = v.trim();
        if (f.secret) {
          f.set = val.length > 0;
          f.last4 = val ? val.slice(-4) : undefined;
          secretOk.set(`${id}.${k}`, val.length >= 12);
        } else {
          f.value = val;
          f.set = val.length > 0;
        }
      }
      if (touched) i.lastCheck = undefined; // new credentials must be re-tested
      // Never log values — only which fields changed.
      const what = Object.keys(values).length
        ? `${i.name}: ${Object.keys(values)
            .map((k) => i.fields.find((f) => f.key === k)?.label ?? k)
            .join(", ")}`
        : i.name;
      log(
        enabled === false
          ? "ইন্টিগ্রেশন বন্ধ"
          : enabled
            ? "ইন্টিগ্রেশন চালু"
            : mode
              ? `মোড → ${mode}`
              : "API সেটিংস পরিবর্তন",
        what,
      );
      return wait(undefined, 150);
    },
    async testIntegration(id) {
      const i = integrations.find((x) => x.id === id);
      if (!i) throw new Error("not_found");
      const missing = i.fields.filter((f) => !f.set && !f.optional);
      const bad = i.fields.find((f) => f.secret && f.set && !secretOk.get(`${id}.${f.key}`));
      const ms = 180 + Math.round(Math.random() * 420);
      const ok = i.enabled && missing.length === 0 && !bad;
      const message = !i.enabled
        ? "ইন্টিগ্রেশন বন্ধ আছে"
        : missing.length
          ? `সেট করা নেই: ${missing.map((f) => f.label).join(", ")}`
          : bad
            ? `${bad.label} গ্রহণ করেনি (401 Unauthorized)`
            : {
                gemini: "মডেল পাওয়া গেছে, কী সচল",
                steadfast: "সংযোগ ঠিক আছে — ব্যালেন্স পড়া গেছে",
                email: "প্রেরক ডোমেইন যাচাই করা",
                firebase: "সার্ভিস অ্যাকাউন্ট সচল",
                maps: "টেস্ট ঠিকানা খুঁজে পাওয়া গেছে",
                sms: "সংযোগ ঠিক আছে",
                bkash: `টোকেন পাওয়া গেছে (${i.mode})`,
                nagad: `সংযোগ ঠিক আছে (${i.mode})`,
                admanager: "Network code সেট আছে",
              }[id];
      i.lastCheck = { ok, ms, message, at: now() };
      log(ok ? "API টেস্ট সফল" : "API টেস্ট ব্যর্থ", i.name);
      return wait(i.lastCheck, ms);
    },

    listPayments: () => wait(store.payments),
    async decidePayment(id, status, note) {
      const p = store.payments.find((x) => x.id === id);
      if (!p) throw new Error("not_found");
      p.status = status;
      if (note) p.note = note;
      log(
        {
          verified: "পেমেন্ট যাচাই (গ্রহণ)",
          rejected: "পেমেন্ট প্রত্যাখ্যান",
          refunded: "পেমেন্ট রিফান্ড",
          cod_collected: "COD সংগ্রহ",
          cod_due: "COD বাকি",
          pending: "পেমেন্ট অপেক্ষমাণ",
        }[status],
        `${p.payer} · ৳${p.amount}`,
      );
      return wait(undefined, 120);
    },
    getPaymentSettings: () => wait(store.paymentSettings),
    async savePaymentSettings(s) {
      store.paymentSettings = structuredClone(s);
      log("পেমেন্ট ও চার্জ সেটিংস পরিবর্তন", "পেমেন্ট");
      return wait(undefined, 120);
    },

    listRiskCases: () => wait(buildCases()),
    async decideRisk(id, status, opts = {}) {
      const c = cases.get(id);
      const seed = riskSeeds.get(id);
      if (!c || !seed) throw new Error("not_found");
      c.status = status;
      c.note = opts.note || c.note;
      if (opts.blockPhone && !isBlocked("phone", seed.phone)) {
        blocklist.unshift({
          id: `b${Date.now()}`,
          type: "phone",
          value: seed.phone,
          reason: opts.note || `ফ্রড চেক: ${seed.item}`,
          added: "এইমাত্র",
        });
        log("নম্বর ব্লক", seed.phone);
      }
      log(
        {
          approved: "ফ্রড চেক — অনুমোদন",
          held: "ফ্রড চেক — হোল্ড",
          rejected: "ফ্রড চেক — বাতিল",
          open: "ফ্রড চেক — আবার খোলা",
        }[status],
        `${seed.user} · ${seed.item}`,
      );
      return wait(undefined, 120);
    },
    async lookupPhone(phone) {
      const p = normalizePhone(phone);
      const valid = isBdMobile(p);
      return wait(
        {
          phone,
          valid,
          operator: valid ? OPERATORS[p.slice(0, 3)] : undefined,
          history: HISTORY[p] ?? null,
          accounts:
            ACCOUNTS[p] ?? seeds.filter((s) => normalizePhone(s.phone) === p).map((s) => s.user),
          blocked: isBlocked("phone", phone),
        },
        400,
      );
    },
    listBlocklist: () => wait(blocklist),
    async addBlock(b) {
      blocklist.unshift({ ...b, id: `b${Date.now()}`, added: "এইমাত্র" });
      log("ব্লকলিস্টে যোগ", b.value);
      return wait(undefined, 100);
    },
    async removeBlock(id) {
      const i = blocklist.findIndex((b) => b.id === id);
      if (i < 0) throw new Error("not_found");
      log("ব্লকলিস্ট থেকে সরানো", blocklist[i].value);
      blocklist.splice(i, 1);
      return wait(undefined, 100);
    },

    listAds: () => wait(store.campaigns),
    async saveAd(a) {
      const i = store.campaigns.findIndex((x) => x.id === a.id);
      if (i >= 0) store.campaigns[i] = structuredClone(a);
      else store.campaigns.unshift(structuredClone(a));
      log(i >= 0 ? "বিজ্ঞাপন সম্পাদনা" : "বিজ্ঞাপন যোগ", a.headline);
      return wait(undefined, 120);
    },
    async deleteAd(id) {
      const i = store.campaigns.findIndex((x) => x.id === id);
      if (i < 0) throw new Error("not_found");
      log("বিজ্ঞাপন মুছে ফেলা", store.campaigns[i].headline);
      store.campaigns.splice(i, 1);
      return wait(undefined, 100);
    },
    getAdNetwork: () => wait(store.adSettings),
    async saveAdNetwork(s) {
      store.adSettings = structuredClone(s);
      syncAdManager();
      log("বিজ্ঞাপন নেটওয়ার্ক সেটিংস", "Ad Manager");
      return wait(undefined, 120);
    },
  };
  return ops;
}
