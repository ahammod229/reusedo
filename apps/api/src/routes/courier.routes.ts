import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { courierZone } from "../lib/bd";
import { HttpError, ah, badRequest, forbidden, must } from "../lib/http";
import { notify } from "../lib/notify";
import { assessReceiver } from "../lib/risk";
import { flagOn, getSetting } from "../lib/settings";
import { type Profile, me, requireAuth } from "../middlewares/auth.middleware";
import { loadExchange } from "./exchange.routes";
import { bdPhone } from "./user.routes";

const router = Router();
router.use(requireAuth);

export interface PaymentSettings {
  methods: Record<"cod" | "bkash" | "nagad", boolean>;
  bkashNumber: string;
  nagadNumber: string;
  charges: { insideDhaka: number; dhakaSuburb: number; outsideDhaka: number; perExtraKg: number };
  baseWeightKg: number;
  advanceFrom: "medium" | "high" | "never";
}

/** Courier charge from the admin's rate card. The client's number is never used. */
export function courierCharge(
  p: PaymentSettings,
  zone: keyof PaymentSettings["charges"],
  weightKg: number,
) {
  const extra = Math.max(0, Math.ceil(weightKg - p.baseWeightKg));
  return p.charges[zone] + extra * p.charges.perExtraKg;
}

interface Snapshot {
  name: string;
  phone: string;
  district: string;
  upazila: string;
  area: string;
  line: string;
  agreedAt: string;
}

interface CourierExchange {
  giver_courier: Snapshot | null;
  receiver_courier: Snapshot | null;
  courier_weight_kg: number | null;
}

async function courierState(exchangeId: string, myId: string) {
  const e = await loadExchange(exchangeId, myId);
  if (e.via !== "courier") throw badRequest("not_courier");
  const db = getSupabaseClient();
  const extra = must(
    await db
      .from("exchanges")
      .select("giver_courier, receiver_courier, courier_weight_kg")
      .eq("id", e.id)
      .single(),
  ) as CourierExchange;
  const request = must(
    await db
      .from("courier_requests")
      .select("id, status, tracking, delivery_status, charge, payments (method, status)")
      .eq("exchange_id", e.id)
      .maybeSingle(),
  ) as {
    id: string;
    status: string;
    tracking: string | null;
    delivery_status: string | null;
    charge: number;
    payments: { method: string; status: string }[];
  } | null;
  return { e, extra, request };
}

// GET /api/courier/:exchangeId — where both sides are, the charge, and the request status.
router.get(
  "/:exchangeId",
  ah(async (req, res) => {
    const myId = me(req).id;
    const { e, extra, request } = await courierState(req.params.exchangeId, myId);
    const giver = e.giver_id === myId;
    const mine = giver ? extra.giver_courier : extra.receiver_courier;
    const pay = await getSetting<PaymentSettings>("payments");
    const g = extra.giver_courier;
    const r = extra.receiver_courier;
    const zone = g && r ? courierZone(g.district, r.district) : null;
    const weight = extra.courier_weight_kg ? Number(extra.courier_weight_kg) : null;
    res.json({
      success: true,
      data: {
        exchangeId: e.id,
        item: e.post.title,
        category: e.post.category_id,
        role: giver ? "giver" : "receiver",
        giverAgreed: !!g,
        receiverAgreed: !!r,
        // Each side sees only their own full address; the other side only the area.
        myAddress: mine,
        pickupArea: g ? `${g.area}, ${g.district}` : null,
        dropoffArea: r ? `${r.area}, ${r.district}` : null,
        weightKg: weight,
        zone,
        charge: zone && weight ? courierCharge(pay, zone, weight) : null,
        request: request && {
          id: request.id,
          status: request.status,
          tracking: request.tracking,
          delivery: request.delivery_status,
          charge: request.charge,
          payment: request.payments[0] ?? null,
        },
        checkout: {
          methods: pay.methods,
          bkashNumber: pay.bkashNumber,
          nagadNumber: pay.nagadNumber,
        },
      },
    });
  }),
);

const agreeBody = z.object({
  name: z.string().trim().min(2).max(80),
  phone: bdPhone,
  district: z.string().trim().min(2).max(40),
  upazila: z.string().trim().min(2).max(60),
  area: z.string().trim().min(2).max(80),
  line: z.string().trim().min(6).max(200),
  // Only the giver knows how heavy the parcel is.
  weightKg: z.number().min(0.1).max(30).optional(),
});

// POST /api/courier/:exchangeId/agree — my consent and my private address.
router.post(
  "/:exchangeId/agree",
  ah(async (req, res) => {
    if (!(await flagOn("courier"))) throw forbidden("courier_disabled");
    const myId = me(req).id;
    const body = agreeBody.parse(req.body);
    const { e, request } = await courierState(req.params.exchangeId, myId);
    if (!["accepted", "scheduled"].includes(e.status)) throw badRequest("not_accepted_yet");
    if (request) throw badRequest("already_requested");
    const giver = e.giver_id === myId;
    if (giver && !body.weightKg) throw badRequest("weight_required");

    const { weightKg, ...address } = body;
    must(
      await getSupabaseClient()
        .from("exchanges")
        .update({
          [giver ? "giver_courier" : "receiver_courier"]: {
            ...address,
            agreedAt: new Date().toISOString(),
          },
          ...(giver && { courier_weight_kg: weightKg }),
        })
        .eq("id", e.id),
    );
    const other = giver ? e.receiver_id : e.giver_id;
    await notify(
      other,
      "courier",
      `‘${e.post.title}’ — কুরিয়ারে পাঠাতে সম্মতি দিয়েছেন`,
      `/courier?exchange=${e.id}`,
    );
    res.json({ success: true });
  }),
);

const requestBody = z.discriminatedUnion("method", [
  z.object({ method: z.literal("cod") }),
  z.object({
    method: z.enum(["bkash", "nagad"]),
    trxId: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{8,12}$/),
    senderNumber: bdPhone,
  }),
]);

// POST /api/courier/:exchangeId/request — receiver, once both agreed. Goes to the admin queue
// with the payment and an automatic risk check.
router.post(
  "/:exchangeId/request",
  ah(async (req, res) => {
    if (!(await flagOn("courier"))) throw forbidden("courier_disabled");
    const p: Profile = me(req);
    const body = requestBody.parse(req.body);
    const { e, extra, request } = await courierState(req.params.exchangeId, p.id);
    if (e.receiver_id !== p.id) throw forbidden("receiver_only");
    if (request) throw badRequest("already_requested");
    const g = extra.giver_courier;
    const r = extra.receiver_courier;
    if (!g || !r || !extra.courier_weight_kg) throw badRequest("both_must_agree");

    const pay = await getSetting<PaymentSettings>("payments");
    if (!pay.methods[body.method]) throw badRequest("method_disabled");
    const zone = courierZone(g.district, r.district);
    const weight = Number(extra.courier_weight_kg);
    const charge = courierCharge(pay, zone, weight);
    const db = getSupabaseClient();

    const flags: string[] = [];
    if (body.method !== "cod") {
      const used = must(
        await db
          .from("payments")
          .select("id")
          .eq("method", body.method)
          .ilike("trx_id", body.trxId)
          .limit(1),
      ) as unknown[];
      if (used.length) throw new HttpError(409, "trx_used", "This transaction ID was already used");
      if (body.senderNumber !== p.phone_number && body.senderNumber !== r.phone) {
        flags.push("প্রেরকের নম্বর গ্রহীতার নম্বরের সাথে মেলেনি");
      }
    }

    const risk = await assessReceiver({
      userId: p.id,
      email: p.email,
      emailVerified: !!p.email_verified_at,
      phone: r.phone,
      createdAt: p.created_at,
      address: { district: r.district, thana: r.upazila, line: `${r.line}, ${r.area}` },
    });
    const order = { low: 0, medium: 1, high: 2 } as const;
    const needsAdvance =
      body.method === "cod" &&
      pay.advanceFrom !== "never" &&
      order[risk.level] >= order[pay.advanceFrom];

    const cr = must(
      await db
        .from("courier_requests")
        .insert({
          exchange_id: e.id,
          item: e.post.title,
          category_id: e.post.category_id,
          giver: {
            name: g.name,
            phone: g.phone,
            address: `${g.line}, ${g.area}, ${g.upazila}, ${g.district}`,
          },
          receiver: {
            name: r.name,
            phone: r.phone,
            address: `${r.line}, ${r.area}, ${r.upazila}, ${r.district}`,
          },
          weight_kg: weight,
          zone,
          charge,
        })
        .select("id")
        .single(),
    ) as { id: string };

    const payment = must(
      await db
        .from("payments")
        .insert({
          courier_request_id: cr.id,
          payer_id: p.id,
          item: e.post.title,
          payer_name: r.name,
          phone: r.phone,
          amount: charge,
          method: body.method,
          ...(body.method !== "cod" && { trx_id: body.trxId, sender_number: body.senderNumber }),
          status: body.method === "cod" ? "cod_due" : "pending",
          flags,
        })
        .select("id, status, method, amount, flags")
        .single(),
    );

    must(
      await db.from("risk_cases").insert({
        courier_request_id: cr.id,
        user_id: p.id,
        item: e.post.title,
        signals: risk.signals,
        history: risk.history,
        // Cash on delivery from a risky account waits for an advance payment.
        status: needsAdvance ? "held" : "open",
        note: needsAdvance ? "ঝুঁকি বেশি — COD নয়, আগাম পেমেন্ট চাওয়া হবে" : null,
      }),
    );
    must(
      await db
        .from("exchanges")
        .update({ status: "scheduled" })
        .eq("id", e.id)
        .eq("status", "accepted"),
    );
    await notify(
      e.giver_id,
      "courier",
      `‘${e.post.title}’ — কুরিয়ার রিকোয়েস্ট অ্যাডমিনের কাছে গেছে`,
      `/courier?exchange=${e.id}`,
    );
    res.status(201).json({ success: true, data: { requestId: cr.id, charge, payment } });
  }),
);

export const courierRouter = router;
