import { getSupabaseClient } from "../database/client";
import { BD_DISTRICTS, isBdMobile } from "./bd";
import { must } from "./http";

// Fraud & address checks for a courier request. Same signals, weights and score as
// apps/web/src/features/admin/risk.ts (the admin UI explains the score; this sets it).

export interface RiskSignal {
  key: string;
  label: string;
  detail: string;
  result: "pass" | "warn" | "fail";
  weight: number;
}

export interface CourierHistory {
  total: number;
  delivered: number;
  returned: number;
  source: string;
}

export const riskScore = (signals: RiskSignal[]) =>
  Math.min(
    100,
    signals.reduce(
      (n, s) => n + (s.result === "fail" ? s.weight : s.result === "warn" ? s.weight / 2 : 0),
      0,
    ),
  );

export const riskLevel = (score: number): "low" | "medium" | "high" =>
  score >= 60 ? "high" : score >= 30 ? "medium" : "low";

/** Our own delivery record for a phone number (Steadfast has no public fraud API we can rely on). */
export async function courierHistory(phone: string): Promise<CourierHistory | null> {
  const rows = must(
    await getSupabaseClient()
      .from("courier_requests")
      .select("delivery_status")
      .eq("receiver->>phone", phone)
      .in("delivery_status", ["delivered", "returned"]),
  ) as { delivery_status: string }[];
  if (rows.length === 0) return null;
  const delivered = rows.filter((r) => r.delivery_status === "delivered").length;
  const returned = rows.length - delivered;
  return { total: rows.length, delivered, returned, source: "ReuseDo" };
}

export async function phoneAccounts(phone: string): Promise<string[]> {
  const rows = must(
    await getSupabaseClient().from("profiles").select("username").eq("phone_number", phone),
  ) as { username: string }[];
  return rows.map((r) => r.username);
}

export async function isBlocked(type: "phone" | "email" | "address", value: string) {
  const { count } = await getSupabaseClient()
    .from("blocklist")
    .select("id", { count: "exact", head: true })
    .eq("type", type)
    .ilike("value", value);
  return (count ?? 0) > 0;
}

export async function assessReceiver(input: {
  userId: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  createdAt: string;
  address: { district: string; thana: string; line: string };
}) {
  const db = getSupabaseClient();
  const [history, accounts, blockedPhone, blockedEmail, recent, reports] = await Promise.all([
    courierHistory(input.phone),
    phoneAccounts(input.phone),
    isBlocked("phone", input.phone),
    isBlocked("email", input.email),
    db
      .from("courier_requests")
      .select("id, exchange:exchanges!inner (receiver_id)", { count: "exact", head: true })
      .eq("exchange.receiver_id", input.userId)
      .gt("created_at", new Date(Date.now() - 86_400_000).toISOString()),
    db
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "user")
      .eq("target_id", input.userId)
      .neq("status", "dismissed"),
  ]);
  const ageDays = Math.floor((Date.now() - new Date(input.createdAt).getTime()) / 86_400_000);
  const requests24h = (recent.count ?? 0) + 1;
  const reportCount = reports.count ?? 0;
  const blocked = blockedPhone || blockedEmail;
  const line = input.address.line.trim();
  const rate = history && history.total > 0 ? history.delivered / history.total : null;

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
      detail: input.emailVerified ? input.email : `${input.email} — কোড দিয়ে যাচাই হয়নি`,
      result: input.emailVerified ? "pass" : "fail",
      weight: 15,
    },
    {
      key: "phone",
      label: "মোবাইল নম্বর সঠিক",
      detail: isBdMobile(input.phone) ? input.phone : `${input.phone} — বাংলাদেশি ১১ ডিজিটের নম্বর নয়`,
      result: isBdMobile(input.phone) ? "pass" : "fail",
      weight: 20,
    },
    {
      key: "shared",
      label: "নম্বর একটি অ্যাকাউন্টেই",
      detail: accounts.length > 1 ? `${accounts.length}টি অ্যাকাউন্টে এই নম্বর` : "শুধু এই অ্যাকাউন্টে",
      result: accounts.length > 1 ? "warn" : "pass",
      weight: 20,
    },
    {
      key: "age",
      label: "অ্যাকাউন্টের বয়স",
      detail: `${ageDays} দিন`,
      result: ageDays >= 14 ? "pass" : ageDays >= 3 ? "warn" : "fail",
      weight: 10,
    },
    {
      key: "velocity",
      label: "গত ২৪ ঘণ্টার রিকোয়েস্ট",
      detail: `${requests24h}টি`,
      result: requests24h <= 2 ? "pass" : requests24h <= 5 ? "warn" : "fail",
      weight: 20,
    },
    {
      key: "district",
      label: "জেলা সঠিক",
      detail: BD_DISTRICTS.has(input.address.district)
        ? input.address.district
        : `“${input.address.district || "—"}” তালিকায় নেই`,
      result: BD_DISTRICTS.has(input.address.district) ? "pass" : "fail",
      weight: 20,
    },
    {
      key: "thana",
      label: "থানা/উপজেলা দেওয়া",
      detail: input.address.thana || "দেওয়া হয়নি",
      result: input.address.thana.trim() ? "pass" : "fail",
      weight: 10,
    },
    {
      key: "line",
      label: "পূর্ণ ঠিকানা",
      detail: line || "দেওয়া হয়নি",
      result:
        line.length >= 10 && /[0-9০-৯]/.test(line) ? "pass" : line.length >= 6 ? "warn" : "fail",
      weight: 15,
    },
    rate === null
      ? {
          key: "history",
          label: "কুরিয়ার ইতিহাস",
          detail: "আগের কোনো রেকর্ড নেই",
          result: "warn",
          weight: 10,
        }
      : {
          key: "history",
          label: "কুরিয়ার ইতিহাস",
          detail: `${history?.total}টির মধ্যে ${history?.delivered}টি নিয়েছেন, ${history?.returned}টি ফেরত (${Math.round(rate * 100)}%)`,
          result: rate >= 0.8 ? "pass" : rate >= 0.5 ? "warn" : "fail",
          weight: 25,
        },
    {
      key: "reports",
      label: "রিপোর্ট",
      detail: reportCount ? `${reportCount}টি রিপোর্ট` : "কোনো রিপোর্ট নেই",
      result: reportCount === 0 ? "pass" : reportCount < 3 ? "warn" : "fail",
      weight: 20,
    },
  ];
  return { signals, history, score: riskScore(signals), level: riskLevel(riskScore(signals)) };
}
