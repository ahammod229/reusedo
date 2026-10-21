import { randomInt } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { adminAuth } from "../config/firebase-admin";
import { getSupabaseClient } from "../database/client";
import { HttpError, must } from "../lib/http";

export interface Profile {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  phone_number: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  area: string | null;
  area_lat: number | null;
  area_lng: number | null;
  level: string | null;
  institution: string;
  show_institution: boolean;
  interests: string[];
  show_on_map: boolean;
  email_verified_at: string | null;
  is_verified: boolean;
  trust_score: number;
  admin_role: "super_admin" | "admin" | "moderator" | null;
  status: "active" | "suspended";
  last_active_at: string;
  created_at: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        email_verified?: boolean;
        profile: Profile;
      };
    }
  }
}

// A request used to cost a profile round trip before any work. Keep profiles for a
// minute; writes that change a profile call forgetProfile() so changes show at once.
const TTL_MS = 60_000;
const cache = new Map<string, { profile: Profile; at: number }>();

export const forgetProfile = (uid: string) => cache.delete(uid);

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16) || "user";

async function loadOrCreate(token: {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}): Promise<Profile> {
  const hit = cache.get(token.uid);
  if (
    hit &&
    Date.now() - hit.at < TTL_MS &&
    (!token.email_verified || hit.profile.email_verified_at)
  ) {
    return hit.profile;
  }

  const db = getSupabaseClient();
  let profile = must(
    await db.from("profiles").select("*").eq("firebase_uid", token.uid).maybeSingle(),
  ) as Profile | null;

  if (!profile) {
    const { data: flag } = await db
      .from("feature_flags")
      .select("enabled")
      .eq("key", "new_signups")
      .maybeSingle();
    if (flag && !flag.enabled)
      throw new HttpError(403, "signups_closed", "New sign-ups are paused");

    const base = slug(token.email?.split("@")[0] ?? "");
    const name = token.name?.trim() || token.email?.split("@")[0] || "User";
    // Usernames are public handles (/users/:username); retry with a suffix on a clash.
    for (let i = 0; i < 5 && !profile; i++) {
      const username = i === 0 ? base : `${base}${randomInt(1000, 9999)}`;
      const { data, error } = await db
        .from("profiles")
        .insert({
          firebase_uid: token.uid,
          email: token.email ?? "",
          display_name: name.slice(0, 80),
          username,
          avatar_url: token.picture ?? null,
          email_verified_at: token.email_verified ? new Date().toISOString() : null,
        })
        .select("*")
        .single();
      if (!error) profile = data as Profile;
      else if ((error as { code?: string }).code !== "23505") throw error;
      else {
        // Either the username clashed, or a parallel first request created this user.
        const again = must(
          await db.from("profiles").select("*").eq("firebase_uid", token.uid).maybeSingle(),
        ) as Profile | null;
        if (again) profile = again;
      }
    }
    if (!profile) throw new HttpError(500, "profile_create_failed");
    await db.from("user_settings").insert({ user_id: profile.id });
  } else if (token.email_verified && !profile.email_verified_at) {
    // Verified through the email code (or Google): record it once.
    profile = must(
      await db
        .from("profiles")
        .update({ email_verified_at: new Date().toISOString() })
        .eq("id", profile.id)
        .select("*")
        .single(),
    ) as Profile;
  }

  // "Active nearby this week" on Home counts this. Hourly is precise enough.
  const seen = profile;
  if (Date.now() - new Date(seen.last_active_at).getTime() > 3_600_000) {
    void db
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", seen.id)
      .then(() => undefined);
  }

  cache.set(token.uid, { profile, at: Date.now() });
  return profile;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const bearer = (req: Request) => {
  const h = req.headers.authorization;
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
};

const authenticate =
  (opts: { enforceVerifiedEmail: boolean; optional?: boolean }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = bearer(req);
    if (!token) {
      if (opts.optional) return next();
      return res
        .status(401)
        .json({ success: false, code: "unauthorized", message: "Missing token" });
    }

    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      // A stale token on a public page shouldn't break the page.
      if (opts.optional) return next();
      return res
        .status(401)
        .json({ success: false, code: "unauthorized", message: "Invalid token" });
    }

    try {
      const profile = await loadOrCreate(decoded);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        profile,
      };

      if (!SAFE_METHODS.has(req.method)) {
        if (profile.status === "suspended") {
          return res
            .status(403)
            .json({ success: false, code: "suspended", message: "This account is suspended" });
        }
        // Accounts must confirm their email code before they can change anything.
        if (opts.enforceVerifiedEmail && !decoded.email_verified) {
          return res.status(403).json({
            success: false,
            code: "email_not_verified",
            message: "Verify your email first",
          });
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };

/** Default guard: signed in, and email-verified for any write (POST/PUT/PATCH/DELETE). */
export const requireAuth = authenticate({ enforceVerifiedEmail: true });

/** Signed in only. Used by the email-code endpoints themselves, which must work before verification. */
export const requireAuthUnverified = authenticate({ enforceVerifiedEmail: false });

/** Public routes that personalise when a valid token is present (distance, own drafts). */
export const optionalAuth = authenticate({ enforceVerifiedEmail: false, optional: true });

/** The signed-in profile; only call after requireAuth. */
export const me = (req: Request): Profile => {
  if (!req.user) throw new HttpError(401, "unauthorized");
  return req.user.profile;
};
