import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { getSupabaseClient } from "../database/client";
import { ah, must } from "../lib/http";
import { integration } from "../lib/integrations";
import { notify } from "../lib/notify";
import { mapDeliveryStatus } from "../lib/steadfast";

const router = Router();

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// POST /api/webhooks/steadfast — delivery updates. Steadfast sends the Bearer token set
// in its panel; it must match the one in Admin → APIs → Steadfast.
router.post(
  "/steadfast",
  ah(async (req, res) => {
    const { values } = await integration("steadfast");
    const sent = req.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!values.webhookToken || !same(sent, values.webhookToken)) {
      res.status(401).json({ success: false, code: "unauthorized", message: "Bad webhook token" });
      return;
    }
    const body = req.body as {
      consignment_id?: number | string;
      status?: string;
      delivery_status?: string;
    };
    const status = mapDeliveryStatus(String(body.delivery_status ?? body.status ?? ""));
    if (!body.consignment_id || !status) {
      res.json({ status: "success", message: "ignored" });
      return;
    }
    const db = getSupabaseClient();
    const c = must(
      await db
        .from("courier_requests")
        .update({ delivery_status: status })
        .eq("consignment_id", String(body.consignment_id))
        .select("exchange_id, item")
        .maybeSingle(),
    ) as { exchange_id: string; item: string } | null;
    if (c) {
      const e = must(
        await db.from("exchanges").select("giver_id, receiver_id").eq("id", c.exchange_id).single(),
      ) as {
        giver_id: string;
        receiver_id: string;
      };
      if (status === "delivered" || status === "returned") {
        const text = status === "delivered" ? `‘${c.item}’ ডেলিভারি হয়েছে` : `‘${c.item}’ ফেরত গেছে`;
        for (const u of [e.giver_id, e.receiver_id])
          await notify(u, "courier", text, `/courier?exchange=${c.exchange_id}`);
      }
    }
    // Steadfast expects this shape.
    res.json({ status: "success", message: "Webhook received successfully." });
  }),
);

export const webhookRouter = router;
