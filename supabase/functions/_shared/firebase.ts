// Verifies Firebase ID tokens and talks to Firebase's admin REST API — no Firebase Admin SDK, no server.
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "npm:jose@5.9.6";
import type { JWTVerifyGetKey } from "npm:jose@5.9.6";
import { env, HttpError } from "./http.ts";

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export interface FirebaseUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  /** True once the token carries the `role: authenticated` claim Supabase needs. */
  hasRoleClaim: boolean;
}

let remote: JWTVerifyGetKey | undefined;
const keys = (): JWTVerifyGetKey => (remote ??= createRemoteJWKSet(new URL(JWKS_URL)));

/** `getKey` is injectable so tests can use their own key pair. */
export async function verifyFirebaseToken(
  req: Request,
  opts: { projectId?: string; getKey?: JWTVerifyGetKey } = {},
): Promise<FirebaseUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "missing_token");
  const projectId = opts.projectId ?? env("FIREBASE_PROJECT_ID");
  try {
    const { payload } = await jwtVerify(token, opts.getKey ?? keys(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Error("no sub");
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === "string" ? payload.name : undefined,
      hasRoleClaim: payload.role === "authenticated",
    };
  } catch {
    throw new HttpError(401, "invalid_token");
  }
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

let cached: { token: string; exp: number } | undefined;

/** OAuth2 access token for the service account (JWT-bearer grant), cached until shortly before expiry. */
async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const sa = JSON.parse(env("FIREBASE_SERVICE_ACCOUNT")) as ServiceAccount;
  const key = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("55m")
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`Google token endpoint answered ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

/**
 * Marks the email verified and adds `role: authenticated`, which Supabase's Firebase integration requires.
 * The browser must then refresh its ID token (getIdToken(true)) to receive the claim.
 */
export async function grantAuthenticated(uid: string, opts: { emailVerified?: boolean } = {}): Promise<void> {
  const projectId = env("FIREBASE_PROJECT_ID");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify({ role: "authenticated" }),
      ...(opts.emailVerified ? { emailVerified: true } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Identity Toolkit answered ${res.status}: ${await res.text()}`);
}
