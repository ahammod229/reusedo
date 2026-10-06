import { BD_DIVISIONS, isBdMobile } from "@/features/geo/bd";
import type {
  AdminRiskCase,
  CourierHistory,
  Integration,
  IntegrationStatus,
  RiskLevel,
  RiskSignal,
} from "./data/types";

// Pure scoring helpers. The server computes the same score when a request is
// created (see BUILD_GUIDE §5.6); the admin UI only explains it.

export const riskScore = (signals: RiskSignal[]) =>
  Math.min(
    100,
    signals.reduce(
      (n, s) => n + (s.result === "fail" ? s.weight : s.result === "warn" ? s.weight / 2 : 0),
      0,
    ),
  );

export const riskLevel = (score: number): RiskLevel =>
  score >= 60 ? "high" : score >= 30 ? "medium" : "low";

export const caseLevel = (c: AdminRiskCase) => riskLevel(riskScore(c.signals));

const DISTRICTS = new Set(BD_DIVISIONS.flatMap((d) => d.districts));

/** Address completeness checks — run before the map lookup (which needs the Maps integration). */
export function addressSignals(a: AdminRiskCase["address"]): RiskSignal[] {
  const line = a.line.trim();
  return [
    {
      key: "district",
      label: "জেলা সঠিক",
      detail: DISTRICTS.has(a.district) ? a.district : `“${a.district || "—"}” তালিকায় নেই`,
      result: DISTRICTS.has(a.district) ? "pass" : "fail",
      weight: 20,
    },
    {
      key: "thana",
      label: "থানা/উপজেলা দেওয়া",
      detail: a.thana || "দেওয়া হয়নি",
      result: a.thana.trim() ? "pass" : "fail",
      weight: 10,
    },
    {
      key: "line",
      label: "পূর্ণ ঠিকানা",
      detail: line || "দেওয়া হয়নি",
      // A deliverable line usually has a house/road number and some length.
      result:
        line.length >= 10 && /[0-9০-৯]/.test(line) ? "pass" : line.length >= 6 ? "warn" : "fail",
      weight: 15,
    },
  ];
}

export function phoneSignal(phone: string): RiskSignal {
  const ok = isBdMobile(phone);
  return {
    key: "phone",
    label: "মোবাইল নম্বর সঠিক",
    detail: ok ? phone : `${phone} — বাংলাদেশি ১১ ডিজিটের নম্বর নয়`,
    result: ok ? "pass" : "fail",
    weight: 20,
  };
}

export function historySignal(h: CourierHistory | null): RiskSignal {
  if (!h || h.total === 0)
    return {
      key: "history",
      label: "কুরিয়ার ইতিহাস",
      detail: "আগের কোনো রেকর্ড নেই",
      result: "warn",
      weight: 10,
    };
  const rate = h.delivered / h.total;
  return {
    key: "history",
    label: "কুরিয়ার ইতিহাস",
    detail: `${h.total}টির মধ্যে ${h.delivered}টি নিয়েছেন, ${h.returned}টি ফেরত (${Math.round(rate * 100)}%)`,
    result: rate >= 0.8 ? "pass" : rate >= 0.5 ? "warn" : "fail",
    weight: 25,
  };
}

export function integrationStatus(i: Integration): IntegrationStatus {
  if (!i.enabled) return "disabled";
  if (i.fields.some((f) => !f.set && !f.optional)) return "not_configured";
  if (!i.lastCheck) return "untested";
  return i.lastCheck.ok ? "connected" : "error";
}
