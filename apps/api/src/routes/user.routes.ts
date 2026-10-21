import { Router } from "express";
import { z } from "zod";
import { adminAuth } from "../config/firebase-admin";
import { getSupabaseClient } from "../database/client";
import { ah, badRequest, forbidden, must, notFound } from "../lib/http";
import { type Profile, forgetProfile, me, requireAuth, requireAuthUnverified } from "../middlewares/auth.middleware";

const router = Router();

const LEVELS = ["primary", "junior", "ssc", "hsc", "admission", "university"] as const;

/** Bangladeshi mobile numbers, stored as 01XXXXXXXXX. */
export const bdPhone = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^\+?88/, ""))
  .refine((s) => /^01[3-9]\d{8}$/.test(s), "invalid_phone");

interface Settings {
  language: "bn" | "en";
  notify_push: boolean;
  notify_email: boolean;
  notify_scope: "area" | "district" | "country";
  allow_messages: boolean;
}

const toMe = (p: Profile, s: Settings | null) => ({
  id: p.id,
  username: p.username,
  name: p.display_name,
  email: p.email,
  avatarUrl: p.avatar_url,
  bio: p.bio,
  phone: p.phone_number,
  division: p.division,
  district: p.district,
  upazila: p.upazila,
  area: p.area,
  hasPin: p.area_lat !== null,
  level: p.level,
  institution: p.institution,
  showInstitution: p.show_institution,
  interests: p.interests,
  showOnMap: p.show_on_map,
  verified: p.is_verified,
  emailVerified: !!p.email_verified_at,
  // Onboarding step 2 (area + phone) is done.
  onboarded: !!(p.district && p.phone_number),
  adminRole: p.admin_role,
  trust: p.trust_score,
  joinedAt: p.created_at,
  settings: s && {
    language: s.language,
    notifyPush: s.notify_push,
    notifyEmail: s.notify_email,
    notifyScope: s.notify_scope,
    allowMessages: s.allow_messages,
  },
});

async function sendMe(res: import("express").Response, uid: string) {
  const db = getSupabaseClient();
  const p = must(await db.from("profiles").select("*").eq("firebase_uid", uid).single()) as Profile;
  const s = must(await db.from("user_settings").select("*").eq("user_id", p.id).maybeSingle()) as Settings | null;
  res.json({ success: true, data: toMe(p, s) });
}

// GET /api/users/me — works before email verification (the onboarding screens need it).
router.get(
  "/me",
  requireAuthUnverified,
  ah(async (req, res) => sendMe(res, me(req).firebase_uid)),
);

const profileUpdate = z
  .object({
    name: z.string().trim().min(2).max(80),
    bio: z.string().trim().max(300),
    phone: bdPhone,
    division: z.string().trim().max(40),
    district: z.string().trim().min(2).max(40),
    upazila: z.string().trim().max(60),
    area: z.string().trim().max(80),
    // Already rounded on the client; round again so nothing finer than ~100 m is stored.
    pin: z.tuple([z.number().min(20).max(27), z.number().min(88).max(93)]).nullable(),
    level: z.enum(LEVELS).nullable(),
    institution: z.string().trim().max(120),
    showInstitution: z.boolean(),
    interests: z.array(z.string().max(40)).max(10),
    showOnMap: z.boolean(),
    settings: z
      .object({
        language: z.enum(["bn", "en"]),
        notifyPush: z.boolean(),
        notifyEmail: z.boolean(),
        notifyScope: z.enum(["area", "district", "country"]),
        allowMessages: z.boolean(),
      })
      .partial(),
  })
  .partial()
  .strict();

const round3 = (n: number) => Math.round(n * 1000) / 1000;

// PATCH /api/users/me — onboarding (area + phone) and Edit profile. Allowed before email
// verification because onboarding saves the area right after the code step.
router.patch(
  "/me",
  requireAuthUnverified,
  ah(async (req, res) => {
    const p = me(req);
    const u = profileUpdate.parse(req.body);
    const db = getSupabaseClient();

    if (u.phone) {
      const { count } = await db
        .from("blocklist")
        .select("id", { count: "exact", head: true })
        .eq("type", "phone")
        .eq("value", u.phone);
      if (count) throw forbidden("phone_blocked");
    }

    const row: Record<string, unknown> = {};
    if (u.name !== undefined) row.display_name = u.name;
    if (u.bio !== undefined) row.bio = u.bio;
    if (u.phone !== undefined) row.phone_number = u.phone;
    if (u.division !== undefined) row.division = u.division;
    if (u.district !== undefined) row.district = u.district;
    if (u.upazila !== undefined) row.upazila = u.upazila;
    if (u.area !== undefined) row.area = u.area;
    if (u.pin !== undefined) {
      row.area_lat = u.pin ? round3(u.pin[0]) : null;
      row.area_lng = u.pin ? round3(u.pin[1]) : null;
    }
    if (u.level !== undefined) row.level = u.level;
    if (u.institution !== undefined) row.institution = u.institution;
    if (u.showInstitution !== undefined) row.show_institution = u.showInstitution;
    if (u.interests !== undefined) row.interests = [...new Set(u.interests)];
    if (u.showOnMap !== undefined) row.show_on_map = u.showOnMap;

    if (Object.keys(row).length) must(await db.from("profiles").update(row).eq("id", p.id));
    if (u.settings && Object.keys(u.settings).length) {
      const s = u.settings;
      must(
        await db.from("user_settings").upsert({
          user_id: p.id,
          ...(s.language && { language: s.language }),
          ...(s.notifyPush !== undefined && { notify_push: s.notifyPush }),
          ...(s.notifyEmail !== undefined && { notify_email: s.notifyEmail }),
          ...(s.notifyScope && { notify_scope: s.notifyScope }),
          ...(s.allowMessages !== undefined && { allow_messages: s.allowMessages }),
          updated_at: new Date().toISOString(),
        }),
      );
    }
    // Phone/area complete the "verified" badge, which counts toward trust.
    if (row.phone_number || row.district) await db.rpc("refresh_trust", { p_user: p.id });
    forgetProfile(p.firebase_uid);
    await sendMe(res, p.firebase_uid);
  }),
);

// DELETE /api/users/me — removes the account and everything it owns (posts, chats, exchanges).
router.delete(
  "/me",
  requireAuthUnverified,
  ah(async (req, res) => {
    const p = me(req);
    // The user types their username to confirm, so a stray request can't wipe an account.
    if (req.body?.confirm !== p.username) throw badRequest("confirm_username");
    must(await getSupabaseClient().from("profiles").delete().eq("id", p.id));
    forgetProfile(p.firebase_uid);
    try {
      await adminAuth.deleteUser(p.firebase_uid);
    } catch (e) {
      // Without a service account the login stays; the data is gone either way.
      console.error("Firebase user delete failed", e);
    }
    res.json({ success: true });
  }),
);

// GET /api/users/:username — public profile. Never includes phone, email or exact location.
router.get(
  "/:username",
  ah(async (req, res) => {
    const db = getSupabaseClient();
    const p = must(
      await db
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, bio, area, district, level, institution, show_institution, is_verified, email_verified_at, phone_number, trust_score, status, created_at",
        )
        .eq("username", req.params.username.toLowerCase())
        .maybeSingle(),
    ) as
      | (Pick<
          Profile,
          | "id"
          | "username"
          | "display_name"
          | "avatar_url"
          | "bio"
          | "area"
          | "district"
          | "level"
          | "institution"
          | "show_institution"
          | "is_verified"
          | "email_verified_at"
          | "phone_number"
          | "trust_score"
          | "status"
          | "created_at"
        >)
      | null;
    if (!p || p.status !== "active") throw notFound("user_not_found");

    const [stats, reviews, thanks] = await Promise.all([
      db.rpc("profile_stats", { p_user: p.id }).then(must),
      db
        .from("reviews")
        .select("rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey (display_name)")
        .eq("reviewee_id", p.id)
        .eq("flagged", false)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(must),
      db
        .from("thanks")
        .select(
          "text, created_at, from:profiles!thanks_from_id_fkey (display_name), exchange:exchanges (post:posts (title))",
        )
        .eq("to_id", p.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(must),
    ]);

    type Review = { rating: number; comment: string; created_at: string; reviewer: { display_name: string } };
    type Thanks = {
      text: string;
      created_at: string;
      from: { display_name: string };
      exchange: { post: { title: string } };
    };
    res.json({
      success: true,
      data: {
        username: p.username,
        name: p.display_name,
        avatarUrl: p.avatar_url,
        verified: p.is_verified,
        trust: p.trust_score,
        area: p.area ?? "",
        district: p.district ?? "",
        joinedAt: p.created_at,
        bio: p.bio,
        badges: [
          ...(p.email_verified_at ? ["email"] : []),
          ...(p.phone_number ? ["phone"] : []),
          ...(p.district ? ["address"] : []),
        ],
        level: p.level ?? undefined,
        institution: p.show_institution && p.institution ? p.institution : undefined,
        stats,
        reviews: (reviews as unknown as Review[]).map((r) => ({
          by: r.reviewer.display_name,
          stars: r.rating,
          text: r.comment,
          at: r.created_at,
        })),
        thanks: (thanks as unknown as Thanks[]).map((t) => ({
          by: t.from.display_name,
          item: t.exchange.post.title,
          text: t.text,
          at: t.created_at,
        })),
      },
    });
  }),
);

// POST /api/users/me/fcm-token — register this device for push notifications.
router.post(
  "/me/fcm-token",
  requireAuth,
  ah(async (req, res) => {
    const { token } = z.object({ token: z.string().min(20).max(4096) }).parse(req.body);
    must(
      await getSupabaseClient()
        .from("fcm_tokens")
        .upsert({ user_id: me(req).id, token, device_info: req.get("user-agent")?.slice(0, 200) ?? null }, {
          onConflict: "user_id,token",
        }),
    );
    res.json({ success: true });
  }),
);

export const userRouter = router;
