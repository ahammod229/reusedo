// An admin confirms or rejects a courier request. Confirming books the parcel with Steadfast (secret keys live here).
//   POST { id, decision: "confirmed" | "rejected", note?, tracking_code? }
// If STEADFAST_API_KEY / STEADFAST_SECRET_KEY are not set, the admin books by hand and passes tracking_code instead.
import { serviceClient } from "../_shared/db.ts";
import { verifyFirebaseToken } from "../_shared/firebase.ts";
import { handler, HttpError, json, readJson } from "../_shared/http.ts";

interface CourierRow {
  id: string;
  exchange_id: string;
  item: string;
  giver_name: string;
  giver_address: string;
  receiver_name: string;
  receiver_phone: string | null;
  receiver_address: string;
  charge: number;
  weight_kg: number;
}

/** Steadfast "create order" body. The courier collects `charge` from the receiver (COD); the item itself is free. */
export function steadfastPayload(r: CourierRow) {
  return {
    invoice: `RD-${r.id.slice(0, 8)}`,
    recipient_name: r.receiver_name,
    recipient_phone: r.receiver_phone ?? "",
    recipient_address: r.receiver_address,
    cod_amount: r.charge,
    note: `ReuseDo · ${r.item} · from ${r.giver_name}, ${r.giver_address}`.slice(0, 250),
  };
}

async function bookWithSteadfast(r: CourierRow): Promise<string> {
  const res = await fetch("https://portal.packzy.com/api/v1/create_order", {
    method: "POST",
    headers: {
      "Api-Key": Deno.env.get("STEADFAST_API_KEY")!,
      "Secret-Key": Deno.env.get("STEADFAST_SECRET_KEY")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(steadfastPayload(r)),
  });
  const data = await res.json().catch(() => ({})) as { consignment?: { tracking_code?: string }; message?: string };
  const code = data.consignment?.tracking_code;
  if (!res.ok || !code) throw new HttpError(502, "courier_rejected", data.message ?? `Steadfast answered ${res.status}`);
  return code;
}

if (import.meta.main) {
  Deno.serve(handler(async (req) => {
    const user = await verifyFirebaseToken(req);
    const db = serviceClient();

    const { data: admin } = await db.from("profiles").select("id, role").eq("firebase_uid", user.uid).maybeSingle();
    if (!admin || admin.role !== "admin") throw new HttpError(403, "not_admin");

    const body = await readJson<{ id?: string; decision?: string; note?: string; tracking_code?: string }>(req);
    if (!body.id || !["confirmed", "rejected"].includes(body.decision ?? "")) throw new HttpError(400, "bad_request");

    // Claim the row so two admins (or a double click) cannot book two parcels.
    const { data: claimed } = await db.from("courier_requests")
      .update({ decided_at: new Date().toISOString(), decided_by: admin.id })
      .eq("id", body.id).eq("status", "pending").is("decided_at", null)
      .select("*").maybeSingle();
    if (!claimed) throw new HttpError(409, "already_decided");
    const row = claimed as CourierRow;

    const release = () => db.from("courier_requests").update({ decided_at: null, decided_by: null }).eq("id", row.id);
    let tracking: string | null = null;
    try {
      if (body.decision === "confirmed") {
        tracking = Deno.env.get("STEADFAST_API_KEY") && Deno.env.get("STEADFAST_SECRET_KEY")
          ? await bookWithSteadfast(row)
          : (body.tracking_code ?? "").trim().slice(0, 40) || null;
        if (!tracking) throw new HttpError(400, "tracking_code_required", "Steadfast keys are not set: enter the tracking code");
      }
      const { error } = await db.from("courier_requests").update({
        status: body.decision,
        tracking_code: tracking,
        admin_note: (body.note ?? "").slice(0, 300) || null,
      }).eq("id", row.id);
      if (error) throw error;
    } catch (e) {
      await release();
      throw e;
    }

    const { data: ex } = await db.from("exchanges").select("giver_id, receiver_id").eq("id", row.exchange_id).single();
    if (ex) {
      const ok = body.decision === "confirmed";
      await db.from("notifications").insert([ex.giver_id, ex.receiver_id].map((pid) => ({
        profile_id: pid,
        kind: "courier",
        text_bn: ok ? `কুরিয়ার প্রস্তুত — ট্র্যাকিং কোড ${tracking}` : "কুরিয়ার রিকোয়েস্ট গ্রহণ করা যায়নি",
        text_en: ok ? `Courier booked — tracking code ${tracking}` : "The courier request was declined",
        route: "/exchanges",
      })));
    }
    return json(req, { ok: true, status: body.decision, tracking_code: tracking });
  }));
}
