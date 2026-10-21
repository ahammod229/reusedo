import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { audit } from "../lib/audit";
import { isBdMobile, normalizePhone } from "../lib/bd";
import { HttpError, ah, badRequest, forbidden, must, notFound } from "../lib/http";
import {
  type IntegrationId,
  CATALOG,
  listForAdmin,
  saveIntegration,
  testIntegration,
} from "../lib/integrations";
import { notify } from "../lib/notify";
import { courierHistory, phoneAccounts } from "../lib/risk";
import { forgetFlag, saveSetting, getSetting } from "../lib/settings";
import { createOrder } from "../lib/steadfast";
import { forgetProfile, me, requireAuth } from "../middlewares/auth.middleware";
import { ADMINS, ALL_ADMINS, SUPER, requireAdmin } from "../middlewares/rbac.middleware";
import { releasePost } from "./exchange.routes";

// Mirrors apps/web/src/features/admin/permissions.ts (ACCESS). The UI hides what a role
// can't use; these guards are what actually stop it.
const router = Router();
router.use(requireAuth, requireAdmin(ALL_ADMINS));

const db = () => getSupabaseClient();
const uuid = z.string().uuid();
const id = (v: string) => {
  const r = uuid.safeParse(v);
  if (!r.success) throw notFound();
  return r.data;
};
const ok = (res: import("express").Response) => res.json({ success: true });
const LIST = 500;

// --- dashboard --------------------------------------------------------------

router.get(
  "/stats",
  ah(async (_req, res) => {
    res.json({ success: true, data: must(await db().rpc("admin_stats")) });
  }),
);

// --- users ------------------------------------------------------------------

router.get(
  "/users",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db()
        .from("profiles")
        .select(
          "id, display_name, email, district, created_at, admin_role, status, is_verified, trust_score, posts (count)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as unknown as {
      id: string;
      display_name: string;
      email: string;
      district: string | null;
      created_at: string;
      admin_role: string | null;
      status: string;
      is_verified: boolean;
      trust_score: number;
      posts: { count: number }[];
    }[];
    res.json({
      success: true,
      data: rows.map((u) => ({
        id: u.id,
        name: u.display_name,
        email: u.email,
        district: u.district ?? "",
        joined: u.created_at,
        role: u.admin_role ?? "user",
        status: u.status,
        verified: u.is_verified,
        posts: u.posts[0]?.count ?? 0,
        trust: u.trust_score,
      })),
    });
  }),
);

router.patch(
  "/users/:id/status",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const target = id(req.params.id);
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(req.body);
    if (target === me(req).id) throw forbidden("not_yourself");
    const u = must(
      await db()
        .from("profiles")
        .select("firebase_uid, admin_role, display_name")
        .eq("id", target)
        .maybeSingle(),
    ) as { firebase_uid: string; admin_role: string | null; display_name: string } | null;
    if (!u) throw notFound();
    // Only a super admin can suspend another admin.
    if (u.admin_role && me(req).admin_role !== "super_admin") throw forbidden("admins_need_super");
    must(await db().from("profiles").update({ status }).eq("id", target));
    forgetProfile(u.firebase_uid);
    await audit(
      me(req).id,
      status === "suspended" ? "user.suspend" : "user.activate",
      u.display_name,
    );
    ok(res);
  }),
);

// --- posts ------------------------------------------------------------------

router.get(
  "/posts",
  ah(async (_req, res) => {
    const [posts, reports] = await Promise.all([
      db()
        .from("posts")
        .select(
          "id, title, kind, category_id, status, created_at, owner:profiles!posts_owner_id_fkey (display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST)
        .then(must),
      db()
        .from("reports")
        .select("target_id")
        .eq("target_type", "post")
        .in("status", ["open", "investigating"])
        .then(must),
    ]);
    const counts = new Map<string, number>();
    for (const r of reports as { target_id: string }[])
      counts.set(r.target_id, (counts.get(r.target_id) ?? 0) + 1);
    type Row = {
      id: string;
      title: string;
      kind: string;
      category_id: string;
      status: string;
      created_at: string;
      owner: { display_name: string };
    };
    res.json({
      success: true,
      data: (posts as unknown as Row[]).map((p) => ({
        id: p.id,
        title: p.title,
        kind: p.kind,
        author: p.owner.display_name,
        category: p.category_id,
        // The admin screen only distinguishes visible / hidden / deleted.
        status: p.status === "hidden" || p.status === "deleted" ? p.status : "published",
        reports: counts.get(p.id) ?? 0,
        created: p.created_at,
      })),
    });
  }),
);

async function setPostStatus(postId: string, status: "published" | "hidden" | "deleted") {
  const p = must(
    await db().from("posts").select("id, title, status, given_at").eq("id", postId).maybeSingle(),
  ) as {
    title: string;
    status: string;
    given_at: string | null;
  } | null;
  if (!p) throw notFound();
  // Restoring returns it to how it was before moderation.
  const next = status === "published" ? (p.given_at ? "given" : "available") : status;
  must(await db().from("posts").update({ status: next }).eq("id", postId));
  return p.title;
}

router.patch(
  "/posts/:id/status",
  ah(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(["published", "hidden", "deleted"]) })
      .parse(req.body);
    const title = await setPostStatus(id(req.params.id), status);
    await audit(
      me(req).id,
      `post.${status === "published" ? "restore" : status === "hidden" ? "hide" : "delete"}`,
      title,
    );
    ok(res);
  }),
);

// --- exchanges --------------------------------------------------------------

router.get(
  "/exchanges",
  ah(async (_req, res) => {
    type Row = {
      id: string;
      status: string;
      via: string;
      updated_at: string;
      post: { title: string };
      giver: { display_name: string };
      receiver: { display_name: string };
    };
    const rows = must(
      await db()
        .from("exchanges")
        .select(
          "id, status, via, updated_at, post:posts!exchanges_post_id_fkey (title), giver:profiles!exchanges_giver_id_fkey (display_name), receiver:profiles!exchanges_receiver_id_fkey (display_name)",
        )
        .order("updated_at", { ascending: false })
        .limit(LIST),
    ) as unknown as Row[];
    res.json({
      success: true,
      data: rows.map((e) => ({
        id: e.id,
        item: e.post.title,
        giver: e.giver.display_name,
        receiver: e.receiver.display_name,
        status: e.status,
        via: e.via,
        updated: e.updated_at,
      })),
    });
  }),
);

router.post(
  "/exchanges/:id/cancel",
  ah(async (req, res) => {
    const e = must(
      await db()
        .from("exchanges")
        .select(
          "id, status, post_id, giver_id, receiver_id, post:posts!exchanges_post_id_fkey (title)",
        )
        .eq("id", id(req.params.id))
        .maybeSingle(),
    ) as unknown as {
      id: string;
      status: string;
      post_id: string;
      giver_id: string;
      receiver_id: string;
      post: { title: string };
    } | null;
    if (!e) throw notFound();
    if (e.status === "completed" || e.status === "cancelled") throw badRequest("already_closed");
    must(
      await db()
        .from("exchanges")
        .update({ status: "cancelled", handover_code_hash: null })
        .eq("id", e.id),
    );
    await releasePost(e.post_id);
    for (const u of [e.giver_id, e.receiver_id]) {
      await notify(u, "request", `‘${e.post.title}’ — অ্যাডমিন লেনদেনটি বাতিল করেছেন`, "/exchanges");
    }
    await audit(me(req).id, "exchange.cancel", e.post.title);
    ok(res);
  }),
);

// --- reports ----------------------------------------------------------------

router.get(
  "/reports",
  ah(async (_req, res) => {
    type Row = {
      id: string;
      target_type: "post" | "user" | "message" | "review";
      target_id: string;
      reason: string;
      details: string;
      status: string;
      created_at: string;
      reporter: { display_name: string };
    };
    const rows = must(
      await db()
        .from("reports")
        .select(
          "id, target_type, target_id, reason, details, status, created_at, reporter:profiles!reports_reporter_id_fkey (display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as unknown as Row[];

    // One lookup per target type for a readable label.
    const ids = (t: Row["target_type"]) =>
      rows.filter((r) => r.target_type === t).map((r) => r.target_id);
    const [posts, users, messages, reviews] = await Promise.all([
      db().from("posts").select("id, title").in("id", ids("post")).then(must),
      db().from("profiles").select("id, display_name").in("id", ids("user")).then(must),
      db().from("messages").select("id, content").in("id", ids("message")).then(must),
      db().from("reviews").select("id, comment").in("id", ids("review")).then(must),
    ]);
    const label = new Map<string, string>();
    for (const p of posts as { id: string; title: string }[]) label.set(p.id, p.title);
    for (const u of users as { id: string; display_name: string }[])
      label.set(u.id, u.display_name);
    for (const m of messages as { id: string; content: string }[])
      label.set(m.id, m.content.slice(0, 80));
    for (const r of reviews as { id: string; comment: string }[])
      label.set(r.id, r.comment.slice(0, 80));

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        targetType: r.target_type,
        targetId: r.target_id,
        targetLabel: label.get(r.target_id) ?? "—",
        // "sold" comes from the public form; the admin list groups it under "other".
        reason: r.reason === "sold" ? "other" : r.reason,
        details: r.details,
        reporter: r.reporter.display_name,
        status: r.status,
        created: r.created_at,
      })),
    });
  }),
);

router.patch(
  "/reports/:id",
  ah(async (req, res) => {
    const { status, hideTarget } = z
      .object({
        status: z.enum(["open", "investigating", "resolved", "dismissed"]),
        hideTarget: z.boolean().optional(),
      })
      .parse(req.body);
    const r = must(
      await db()
        .from("reports")
        .select("id, target_type, target_id")
        .eq("id", id(req.params.id))
        .maybeSingle(),
    ) as {
      target_type: string;
      target_id: string;
    } | null;
    if (!r) throw notFound();
    must(await db().from("reports").update({ status }).eq("id", req.params.id));

    let owner: string | null = null;
    if (r.target_type === "post") {
      const p = must(
        await db().from("posts").select("owner_id").eq("id", r.target_id).maybeSingle(),
      ) as { owner_id: string } | null;
      owner = p?.owner_id ?? null;
      if (hideTarget && p) await setPostStatus(r.target_id, "hidden");
    } else if (r.target_type === "review" && hideTarget) {
      must(await db().from("reviews").update({ flagged: true }).eq("id", r.target_id));
    } else if (r.target_type === "user") {
      owner = r.target_id;
      if (hideTarget) {
        if (me(req).admin_role === "moderator") throw forbidden("suspend_needs_admin");
        const u = must(
          await db()
            .from("profiles")
            .update({ status: "suspended" })
            .eq("id", r.target_id)
            .select("firebase_uid")
            .maybeSingle(),
        ) as {
          firebase_uid: string;
        } | null;
        if (u) forgetProfile(u.firebase_uid);
      }
    }
    // Upheld reports count against trust.
    if (owner) await db().rpc("refresh_trust", { p_user: owner });
    await audit(
      me(req).id,
      `report.${status}${hideTarget ? "+hide" : ""}`,
      `${r.target_type} ${r.target_id}`,
    );
    ok(res);
  }),
);

// --- verification (accounts flagged by automatic checks) --------------------

router.get(
  "/verifications",
  ah(async (_req, res) => {
    type Row = {
      id: string;
      flags: string[];
      status: string;
      created_at: string;
      user: {
        display_name: string;
        email: string;
        area: string | null;
        upazila: string | null;
        district: string | null;
      };
    };
    const rows = must(
      await db()
        .from("verifications")
        .select(
          "id, flags, status, created_at, user:profiles!verifications_user_id_fkey (display_name, email, area, upazila, district)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as unknown as Row[];
    res.json({
      success: true,
      data: rows.map((v) => ({
        id: v.id,
        user: v.user.display_name,
        email: v.user.email,
        address: [v.user.area, v.user.upazila, v.user.district].filter(Boolean).join(", "),
        flags: v.flags,
        status: v.status,
        created: v.created_at,
      })),
    });
  }),
);

router.patch(
  "/verifications/:id",
  ah(async (req, res) => {
    const { status } = z.object({ status: z.enum(["approved", "rejected"]) }).parse(req.body);
    const v = must(
      await db()
        .from("verifications")
        .update({ status, decided_by: me(req).id, decided_at: new Date().toISOString() })
        .eq("id", id(req.params.id))
        .select("user_id")
        .maybeSingle(),
    ) as { user_id: string } | null;
    if (!v) throw notFound();
    await audit(me(req).id, `verification.${status}`, v.user_id);
    ok(res);
  }),
);

// --- reviews ----------------------------------------------------------------

router.get(
  "/reviews",
  ah(async (_req, res) => {
    type Row = {
      id: string;
      rating: number;
      comment: string;
      flagged: boolean;
      created_at: string;
      reviewer: { display_name: string };
      reviewee: { display_name: string };
    };
    const rows = must(
      await db()
        .from("reviews")
        .select(
          "id, rating, comment, flagged, created_at, reviewer:profiles!reviews_reviewer_id_fkey (display_name), reviewee:profiles!reviews_reviewee_id_fkey (display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as unknown as Row[];
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        from: r.reviewer.display_name,
        to: r.reviewee.display_name,
        stars: r.rating,
        text: r.comment,
        created: r.created_at,
        flagged: r.flagged,
      })),
    });
  }),
);

router.delete(
  "/reviews/:id",
  ah(async (req, res) => {
    const r = must(
      await db()
        .from("reviews")
        .delete()
        .eq("id", id(req.params.id))
        .select("reviewee_id, comment")
        .maybeSingle(),
    ) as {
      reviewee_id: string;
      comment: string;
    } | null;
    if (!r) throw notFound();
    await db().rpc("refresh_trust", { p_user: r.reviewee_id });
    await audit(me(req).id, "review.delete", r.comment.slice(0, 60));
    ok(res);
  }),
);

// --- categories -------------------------------------------------------------

router.get(
  "/categories",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db()
        .from("categories")
        .select("id, name_bn, name_en, emoji, enabled, posts (count)")
        .order("sort"),
    ) as unknown as {
      id: string;
      name_bn: string;
      name_en: string;
      emoji: string;
      enabled: boolean;
      posts: { count: number }[];
    }[];
    res.json({
      success: true,
      data: rows.map((c) => ({
        id: c.id,
        bn: c.name_bn,
        en: c.name_en,
        emoji: c.emoji,
        enabled: c.enabled,
        posts: c.posts[0]?.count ?? 0,
      })),
    });
  }),
);

router.put(
  "/categories/:id",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const c = z
      .object({
        bn: z.string().trim().min(1).max(40),
        en: z.string().trim().min(1).max(40),
        emoji: z.string().trim().min(1).max(8),
        enabled: z.boolean(),
      })
      .parse(req.body);
    const slug = z
      .string()
      .regex(/^[a-z][a-z0-9_-]{1,39}$/)
      .parse(req.params.id);
    must(
      await db()
        .from("categories")
        .upsert({ id: slug, name_bn: c.bn, name_en: c.en, emoji: c.emoji, enabled: c.enabled }),
    );
    await audit(me(req).id, "category.save", slug);
    ok(res);
  }),
);

// --- CMS pages --------------------------------------------------------------

router.get(
  "/pages",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db().from("cms_pages").select("slug, title, body, status, updated_at").order("slug"),
    ) as {
      slug: string;
      title: string;
      body: string;
      status: string;
      updated_at: string;
    }[];
    res.json({
      success: true,
      data: rows.map((p) => ({
        slug: p.slug,
        title: p.title,
        body: p.body,
        status: p.status,
        updated: p.updated_at,
      })),
    });
  }),
);

router.put(
  "/pages/:slug",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const p = z
      .object({
        title: z.string().trim().min(1).max(120),
        body: z.string().max(100_000),
        status: z.enum(["published", "draft"]),
      })
      .parse(req.body);
    const slug = z
      .string()
      .regex(/^[a-z][a-z0-9-]{1,40}$/)
      .parse(req.params.slug);
    must(
      await db()
        .from("cms_pages")
        .upsert({ slug, ...p, updated_by: me(req).id }),
    );
    await audit(me(req).id, `page.${p.status === "published" ? "publish" : "save"}`, slug);
    ok(res);
  }),
);

// --- settings & flags (super admin) ------------------------------------------

const generalSettings = z.object({
  supportEmail: z.string().email(),
  aiDailyLimit: z.number().int().min(0).max(500),
  maxPhotos: z.number().int().min(1).max(10),
  requestExpiryDays: z.number().int().min(1).max(90),
  maintenanceMode: z.boolean(),
});

router.get(
  "/settings",
  requireAdmin(SUPER),
  ah(async (_req, res) => {
    res.json({ success: true, data: await getSetting("general") });
  }),
);

router.put(
  "/settings",
  requireAdmin(SUPER),
  ah(async (req, res) => {
    await saveSetting("general", generalSettings.parse(req.body), me(req).id);
    await audit(me(req).id, "settings.save", "general");
    ok(res);
  }),
);

router.get(
  "/flags",
  requireAdmin(SUPER),
  ah(async (_req, res) => {
    const rows = must(
      await db().from("feature_flags").select("key, label, description, enabled").order("key"),
    ) as unknown[];
    res.json({ success: true, data: rows });
  }),
);

router.patch(
  "/flags/:key",
  requireAdmin(SUPER),
  ah(async (req, res) => {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
    const row = must(
      await db()
        .from("feature_flags")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("key", req.params.key)
        .select("key")
        .maybeSingle(),
    );
    if (!row) throw notFound();
    forgetFlag(req.params.key);
    await audit(me(req).id, `flag.${enabled ? "on" : "off"}`, req.params.key);
    ok(res);
  }),
);

// --- audit ------------------------------------------------------------------

router.get(
  "/audit",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db()
        .from("audit_logs")
        .select(
          "id, action, target, created_at, actor:profiles!audit_logs_actor_id_fkey (display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as unknown as {
      id: string;
      action: string;
      target: string;
      created_at: string;
      actor: { display_name: string } | null;
    }[];
    res.json({
      success: true,
      data: rows.map((a) => ({
        id: a.id,
        actor: a.actor?.display_name ?? "—",
        action: a.action,
        target: a.target,
        when: a.created_at,
      })),
    });
  }),
);

// --- integrations (super admin) ---------------------------------------------

const integrationIds = CATALOG.map((c) => c.id) as [IntegrationId, ...IntegrationId[]];

router.get(
  "/integrations",
  requireAdmin(SUPER),
  ah(async (_req, res) => {
    res.json({ success: true, data: await listForAdmin() });
  }),
);

router.patch(
  "/integrations/:id",
  requireAdmin(SUPER),
  ah(async (req, res) => {
    const u = z
      .object({
        enabled: z.boolean().optional(),
        mode: z.enum(["sandbox", "live"]).optional(),
        values: z.record(z.string(), z.string().max(20_000)).optional(),
      })
      .parse(req.body);
    const integrationId = z.enum(integrationIds).parse(req.params.id);
    const fields = await saveIntegration({ id: integrationId, ...u }, me(req).id);
    // Which fields changed, never their values.
    await audit(
      me(req).id,
      "integration.save",
      `${integrationId}${fields.length ? `: ${fields.join(", ")}` : ""}`,
    );
    ok(res);
  }),
);

router.post(
  "/integrations/:id/test",
  requireAdmin(SUPER),
  ah(async (req, res) => {
    const integrationId = z.enum(integrationIds).parse(req.params.id);
    res.json({ success: true, data: await testIntegration(integrationId) });
  }),
);

// --- courier queue ----------------------------------------------------------

type CourierRow = {
  id: string;
  exchange_id: string;
  item: string;
  category_id: string;
  giver: { name: string; phone: string; address: string };
  receiver: { name: string; phone: string; address: string };
  weight_kg: number;
  charge: number;
  status: "pending" | "confirmed" | "rejected";
  tracking: string | null;
  created_at: string;
};

const toCourier = (c: CourierRow) => ({
  id: c.id,
  exchangeId: c.exchange_id,
  item: c.item,
  category: c.category_id,
  giver: c.giver,
  receiver: c.receiver,
  weightKg: Number(c.weight_kg),
  charge: c.charge,
  status: c.status,
  tracking: c.tracking ?? undefined,
  createdAt: c.created_at,
});

router.get(
  "/courier-requests",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db()
        .from("courier_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as CourierRow[];
    res.json({ success: true, data: rows.map(toCourier) });
  }),
);

router.post(
  "/courier-requests/:id/decide",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const { decision } = z.object({ decision: z.enum(["confirmed", "rejected"]) }).parse(req.body);
    const c = must(
      await db().from("courier_requests").select("*").eq("id", id(req.params.id)).maybeSingle(),
    ) as CourierRow | null;
    if (!c) throw notFound();
    if (c.status !== "pending") throw badRequest("already_decided");
    const parties = must(
      await db().from("exchanges").select("giver_id, receiver_id").eq("id", c.exchange_id).single(),
    ) as { giver_id: string; receiver_id: string };

    let tracking: string | null = null;
    let consignment: string | null = null;
    if (decision === "confirmed") {
      // Same rules as the queue's disabled Confirm button (CourierQueue blockers()).
      const [risk, pay] = await Promise.all([
        db()
          .from("risk_cases")
          .select("status")
          .eq("courier_request_id", c.id)
          .maybeSingle()
          .then(must),
        db()
          .from("payments")
          .select("status, method")
          .eq("courier_request_id", c.id)
          .maybeSingle()
          .then(must),
      ]);
      const r = risk as { status: string } | null;
      const p = pay as { status: string; method: string } | null;
      if (r && r.status !== "approved")
        throw new HttpError(409, "risk_not_approved", "Approve the fraud check first");
      if (p && (p.status === "pending" || p.status === "rejected"))
        throw new HttpError(409, "payment_not_verified", "Verify the payment first");

      const order = await createOrder({
        invoice: c.id.replace(/-/g, "").slice(0, 20),
        recipient_name: c.receiver.name,
        recipient_phone: c.receiver.phone,
        recipient_address: c.receiver.address,
        // Cash on delivery collects the courier charge; prepaid parcels collect nothing.
        cod_amount: p?.method === "cod" ? c.charge : 0,
        note: `ReuseDo উপহার: ${c.item}। পিকআপ: ${c.giver.name}, ${c.giver.phone}, ${c.giver.address}`,
      });
      tracking = order.tracking;
      consignment = order.consignmentId;
    }
    must(
      await db()
        .from("courier_requests")
        .update({
          status: decision,
          tracking,
          consignment_id: consignment,
          delivery_status: decision === "confirmed" ? "in_review" : null,
          decided_by: me(req).id,
        })
        .eq("id", c.id),
    );
    const text =
      decision === "confirmed"
        ? `আপনার কুরিয়ার রিকোয়েস্ট অনুমোদিত হয়েছে। ট্র্যাকিং: ${tracking}`
        : `‘${c.item}’ — কুরিয়ার রিকোয়েস্ট বাতিল হয়েছে`;
    for (const u of [parties.giver_id, parties.receiver_id])
      await notify(u, "courier", text, `/courier?exchange=${c.exchange_id}`);
    await audit(me(req).id, `courier.${decision}`, c.item);
    const updated = must(
      await db().from("courier_requests").select("*").eq("id", c.id).single(),
    ) as CourierRow;
    res.json({ success: true, data: toCourier(updated) });
  }),
);

// --- payments ---------------------------------------------------------------

router.get(
  "/payments",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db().from("payments").select("*").order("created_at", { ascending: false }).limit(LIST),
    ) as {
      id: string;
      courier_request_id: string | null;
      item: string;
      payer_name: string;
      phone: string;
      amount: number;
      method: string;
      trx_id: string | null;
      sender_number: string | null;
      status: string;
      flags: string[];
      note: string | null;
      created_at: string;
    }[];
    res.json({
      success: true,
      data: rows.map((p) => ({
        id: p.id,
        courierId: p.courier_request_id ?? undefined,
        item: p.item,
        payer: p.payer_name,
        phone: p.phone,
        amount: p.amount,
        method: p.method,
        trxId: p.trx_id ?? undefined,
        senderNumber: p.sender_number ?? undefined,
        status: p.status,
        flags: p.flags,
        note: p.note ?? undefined,
        created: p.created_at,
      })),
    });
  }),
);

router.patch(
  "/payments/:id",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const { status, note } = z
      .object({
        status: z.enum(["pending", "verified", "rejected", "refunded", "cod_due", "cod_collected"]),
        note: z.string().trim().max(300).optional(),
      })
      .parse(req.body);
    if (status === "rejected" && !note) throw badRequest("reason_required");
    const p = must(
      await db()
        .from("payments")
        .update({ status, note: note ?? null, decided_by: me(req).id })
        .eq("id", id(req.params.id))
        .select("payer_id, item, amount")
        .maybeSingle(),
    ) as { payer_id: string; item: string; amount: number } | null;
    if (!p) throw notFound();
    if (status === "verified" || status === "rejected") {
      await notify(
        p.payer_id,
        "courier",
        status === "verified"
          ? `৳${p.amount} পেমেন্ট যাচাই হয়েছে — ‘${p.item}’`
          : `পেমেন্ট গ্রহণ হয়নি: ${note}`,
        "/exchanges",
      );
    }
    await audit(me(req).id, `payment.${status}`, `${p.item} ৳${p.amount}`);
    ok(res);
  }),
);

const paymentSettings = z.object({
  methods: z.object({ cod: z.boolean(), bkash: z.boolean(), nagad: z.boolean() }),
  bkashNumber: z.string().trim().max(20),
  nagadNumber: z.string().trim().max(20),
  charges: z.object({
    insideDhaka: z.number().int().min(0).max(5000),
    dhakaSuburb: z.number().int().min(0).max(5000),
    outsideDhaka: z.number().int().min(0).max(5000),
    perExtraKg: z.number().int().min(0).max(1000),
  }),
  baseWeightKg: z.number().min(0.5).max(10),
  advanceFrom: z.enum(["medium", "high", "never"]),
});

router.get(
  "/payment-settings",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    res.json({ success: true, data: await getSetting("payments") });
  }),
);

router.put(
  "/payment-settings",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const s = paymentSettings.parse(req.body);
    for (const m of ["bkash", "nagad"] as const) {
      if (s.methods[m] && !isBdMobile(s[`${m}Number`])) throw badRequest(`${m}_number_required`);
    }
    await saveSetting("payments", s, me(req).id);
    await audit(me(req).id, "payments.settings", "payments");
    ok(res);
  }),
);

// --- risk & blocklist -------------------------------------------------------

router.get(
  "/risk",
  ah(async (_req, res) => {
    type Row = {
      id: string;
      courier_request_id: string | null;
      item: string;
      signals: unknown[];
      history: unknown;
      status: string;
      note: string | null;
      created_at: string;
      user: { display_name: string; email: string; created_at: string };
      courier: { receiver: { phone: string; address: string } } | null;
    };
    const rows = must(
      await db()
        .from("risk_cases")
        .select(
          "id, courier_request_id, item, signals, history, status, note, created_at, user:profiles!risk_cases_user_id_fkey (display_name, email, created_at), courier:courier_requests (receiver)",
        )
        .order("created_at", { ascending: false })
        .limit(LIST),
    ) as unknown as Row[];
    res.json({
      success: true,
      data: rows.map((r) => {
        // "line, area, upazila, district" as snapshotted on the request.
        const parts = (r.courier?.receiver.address ?? "").split(",").map((s) => s.trim());
        return {
          id: r.id,
          courierId: r.courier_request_id ?? undefined,
          item: r.item,
          user: r.user.display_name,
          phone: r.courier?.receiver.phone ?? "",
          email: r.user.email,
          address: {
            district: parts[parts.length - 1] ?? "",
            thana: parts[parts.length - 2] ?? "",
            line: parts.slice(0, -2).join(", "),
          },
          accountAgeDays: Math.floor(
            (Date.now() - new Date(r.user.created_at).getTime()) / 86_400_000,
          ),
          signals: r.signals,
          history: r.history,
          status: r.status,
          note: r.note ?? undefined,
          created: r.created_at,
        };
      }),
    });
  }),
);

router.patch(
  "/risk/:id",
  ah(async (req, res) => {
    const { status, note, blockPhone } = z
      .object({
        status: z.enum(["open", "approved", "held", "rejected"]),
        note: z.string().trim().max(300).optional(),
        blockPhone: z.boolean().optional(),
      })
      .parse(req.body);
    const r = must(
      await db()
        .from("risk_cases")
        .update({ status, note: note ?? null, decided_by: me(req).id })
        .eq("id", id(req.params.id))
        .select("item, courier_request_id, courier:courier_requests (receiver)")
        .maybeSingle(),
    ) as unknown as {
      item: string;
      courier_request_id: string | null;
      courier: { receiver: { phone: string } } | null;
    } | null;
    if (!r) throw notFound();
    if (status === "rejected" && blockPhone && r.courier) {
      await db()
        .from("blocklist")
        .upsert(
          {
            type: "phone",
            value: r.courier.receiver.phone,
            reason: note ?? r.item,
            added_by: me(req).id,
          },
          { onConflict: "type,value" },
        );
    }
    // A rejected check also turns the courier request down.
    if (status === "rejected" && r.courier_request_id) {
      await db()
        .from("courier_requests")
        .update({ status: "rejected" })
        .eq("id", r.courier_request_id)
        .eq("status", "pending");
    }
    await audit(me(req).id, `risk.${status}${blockPhone ? "+block" : ""}`, r.item);
    ok(res);
  }),
);

router.get(
  "/risk/phone/:phone",
  ah(async (req, res) => {
    const phone = normalizePhone(req.params.phone);
    const [history, accounts, blocked] = await Promise.all([
      courierHistory(phone),
      phoneAccounts(phone),
      db()
        .from("blocklist")
        .select("id", { count: "exact", head: true })
        .eq("type", "phone")
        .eq("value", phone),
    ]);
    const operators: Record<string, string> = {
      "013": "Grameenphone",
      "017": "Grameenphone",
      "014": "Banglalink",
      "019": "Banglalink",
      "015": "Teletalk",
      "016": "Airtel",
      "018": "Robi",
    };
    res.json({
      success: true,
      data: {
        phone,
        valid: isBdMobile(phone),
        operator: operators[phone.slice(0, 3)],
        history,
        accounts,
        blocked: (blocked.count ?? 0) > 0,
      },
    });
  }),
);

router.get(
  "/blocklist",
  ah(async (_req, res) => {
    const rows = must(
      await db()
        .from("blocklist")
        .select("id, type, value, reason, created_at")
        .order("created_at", { ascending: false }),
    ) as {
      id: string;
      type: string;
      value: string;
      reason: string;
      created_at: string;
    }[];
    res.json({
      success: true,
      data: rows.map((b) => ({
        id: b.id,
        type: b.type,
        value: b.value,
        reason: b.reason,
        added: b.created_at,
      })),
    });
  }),
);

router.post(
  "/blocklist",
  ah(async (req, res) => {
    const b = z
      .object({
        type: z.enum(["phone", "email", "device", "address"]),
        value: z.string().trim().min(3).max(200),
        reason: z.string().trim().max(200),
      })
      .parse(req.body);
    const value =
      b.type === "phone"
        ? normalizePhone(b.value)
        : b.type === "email"
          ? b.value.toLowerCase()
          : b.value;
    must(
      await db()
        .from("blocklist")
        .upsert({ ...b, value, added_by: me(req).id }, { onConflict: "type,value" }),
    );
    await audit(me(req).id, "blocklist.add", `${b.type}: ${value}`);
    ok(res);
  }),
);

router.delete(
  "/blocklist/:id",
  ah(async (req, res) => {
    const b = must(
      await db()
        .from("blocklist")
        .delete()
        .eq("id", id(req.params.id))
        .select("type, value")
        .maybeSingle(),
    ) as {
      type: string;
      value: string;
    } | null;
    if (!b) throw notFound();
    await audit(me(req).id, "blocklist.remove", `${b.type}: ${b.value}`);
    ok(res);
  }),
);

// --- ads ----------------------------------------------------------------------

const adBody = z.object({
  advertiser: z.string().trim().min(1).max(80),
  headline: z.string().trim().min(1).max(90),
  body: z.string().trim().max(200),
  cta: z.string().trim().max(30),
  url: z
    .string()
    .trim()
    .regex(/^https?:\/\/[^\s]+\.[^\s]+/i),
  image: z.string().url().max(2000).optional().or(z.literal("")),
  placements: z.array(z.enum(["feed", "sidebar", "post_detail"])).min(1),
  districts: z.array(z.string().max(40)).max(64),
  categories: z.array(z.string().max(40)).max(20),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  weight: z.number().int().min(1).max(10),
  paused: z.boolean(),
});

type AdRow = {
  id: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  url: string;
  image: string | null;
  placements: string[];
  districts: string[];
  categories: string[];
  start_date: string;
  end_date: string | null;
  weight: number;
  paused: boolean;
  impressions: number;
  clicks: number;
};

router.get(
  "/ads",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    const rows = must(
      await db().from("ad_campaigns").select("*").order("created_at", { ascending: false }),
    ) as AdRow[];
    res.json({
      success: true,
      data: rows.map((a) => ({
        id: a.id,
        advertiser: a.advertiser,
        headline: a.headline,
        body: a.body,
        cta: a.cta,
        url: a.url,
        image: a.image ?? undefined,
        placements: a.placements,
        districts: a.districts,
        categories: a.categories,
        start: a.start_date,
        end: a.end_date ?? undefined,
        weight: a.weight,
        paused: a.paused,
        impressions: a.impressions,
        clicks: a.clicks,
      })),
    });
  }),
);

// PUT /admin/ads/:id — create or update ("new" creates).
router.put(
  "/ads/:id",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const a = adBody.parse(req.body);
    const row = {
      advertiser: a.advertiser,
      headline: a.headline,
      body: a.body,
      cta: a.cta,
      url: a.url,
      image: a.image || null,
      placements: a.placements,
      districts: a.districts,
      categories: a.categories,
      start_date: a.start,
      end_date: a.end || null,
      weight: a.weight,
      paused: a.paused,
    };
    const isNew = req.params.id === "new" || !uuid.safeParse(req.params.id).success;
    const saved = must(
      isNew
        ? await db().from("ad_campaigns").insert(row).select("id").single()
        : await db()
            .from("ad_campaigns")
            .update(row)
            .eq("id", req.params.id)
            .select("id")
            .maybeSingle(),
    ) as { id: string } | null;
    if (!saved) throw notFound();
    await audit(me(req).id, isNew ? "ad.create" : "ad.update", a.headline);
    res.json({ success: true, data: { id: saved.id } });
  }),
);

router.delete(
  "/ads/:id",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    const a = must(
      await db()
        .from("ad_campaigns")
        .delete()
        .eq("id", id(req.params.id))
        .select("headline")
        .maybeSingle(),
    ) as {
      headline: string;
    } | null;
    if (!a) throw notFound();
    await audit(me(req).id, "ad.delete", a.headline);
    ok(res);
  }),
);

const adNetwork = z.object({
  adsEnabled: z.boolean(),
  adxEnabled: z.boolean(),
  networkCode: z
    .string()
    .trim()
    .regex(/^\d{0,20}$/),
  units: z.object({
    feed: z.string().max(200),
    sidebar: z.string().max(200),
    post_detail: z.string().max(200),
  }),
  every: z.number().int().min(3).max(50),
  sessionCap: z.number().int().min(0).max(100),
  newUserLight: z.boolean(),
  priority: z.enum(["direct_first", "adx_first", "mix"]),
});

router.get(
  "/ad-network",
  requireAdmin(ADMINS),
  ah(async (_req, res) => {
    res.json({ success: true, data: await getSetting("ad_network") });
  }),
);

router.put(
  "/ad-network",
  requireAdmin(ADMINS),
  ah(async (req, res) => {
    await saveSetting("ad_network", adNetwork.parse(req.body), me(req).id);
    await audit(me(req).id, "ads.network", "ad_network");
    ok(res);
  }),
);

export const adminRouter = router;
