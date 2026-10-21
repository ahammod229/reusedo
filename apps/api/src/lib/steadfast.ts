import { HttpError } from "./http";
import { integration } from "./integrations";

// Steadfast merchant API (create_order, status). Keys come from Admin → APIs or env.
// Steadfast collects from the merchant's registered pickup point; there is no per-order
// pickup address, so the giver's address goes in the note for the rider. Confirm the
// person-to-person pickup arrangement with Steadfast before launch.

export interface SteadfastOrder {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note: string;
}

async function client() {
  const s = await integration("steadfast");
  if (!s.enabled || !s.values.apiKey || !s.values.secretKey) {
    throw new HttpError(503, "steadfast_not_configured", "Set the Steadfast keys in Admin → APIs");
  }
  return {
    base: (s.values.baseUrl ?? "https://portal.packzy.com/api/v1").replace(/\/$/, ""),
    headers: {
      "Api-Key": s.values.apiKey,
      "Secret-Key": s.values.secretKey,
      "Content-Type": "application/json",
    },
  };
}

export async function createOrder(order: SteadfastOrder) {
  const c = await client();
  const res = await fetch(`${c.base}/create_order`, {
    method: "POST",
    headers: c.headers,
    body: JSON.stringify(order),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as {
    status?: number;
    message?: string;
    consignment?: { consignment_id: number | string; tracking_code: string };
  };
  if (!res.ok || !body.consignment) {
    throw new HttpError(
      502,
      "steadfast_failed",
      body.message ?? `Steadfast responded ${res.status}`,
    );
  }
  return {
    consignmentId: String(body.consignment.consignment_id),
    tracking: body.consignment.tracking_code,
  };
}

/** Steadfast delivery statuses → ours. */
export function mapDeliveryStatus(s: string): string | null {
  const v = s.toLowerCase();
  if (v.includes("cancel")) return "cancelled";
  if (v.includes("return")) return "returned";
  if (v === "delivered" || v.includes("delivered_approval") || v === "partial_delivered")
    return "delivered";
  if (v.includes("hold") || v.includes("transit")) return "in_transit";
  if (v.includes("pick")) return "picked_up";
  if (v.includes("review") || v === "pending") return "in_review";
  return null;
}
