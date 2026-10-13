// deno test --allow-env --allow-net=none supabase/functions   (no network, no secrets needed)
import assert from "node:assert/strict";
import { exportJWK, generateKeyPair, SignJWT } from "npm:jose@5.9.6";
import { verifyFirebaseToken } from "./_shared/firebase.ts";
import { handler, HttpError } from "./_shared/http.ts";
import { codesMatch, hashCode, newCode } from "./email-code/index.ts";
import { geminiBody, parseDraft } from "./ai-draft/index.ts";
import { steadfastPayload } from "./admin-courier/index.ts";

const PROJECT = "reuse-do";
const { publicKey, privateKey } = await generateKeyPair("RS256");
const other = await generateKeyPair("RS256");
const jwk = await exportJWK(publicKey);
const getKey = () => Promise.resolve(publicKey);

async function token(claims: Record<string, unknown> = {}, o: { aud?: string; iss?: string; exp?: string; key?: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"] } = {}) {
  return await new SignJWT({ email: "a@x.com", email_verified: true, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: String(jwk.kid ?? "k1") })
    .setSubject("uidA")
    .setIssuer(o.iss ?? `https://securetoken.google.com/${PROJECT}`)
    .setAudience(o.aud ?? PROJECT)
    .setIssuedAt()
    .setExpirationTime(o.exp ?? "1h")
    .sign(o.key ?? privateKey);
}
const req = (t?: string) => new Request("https://x", { method: "POST", headers: t ? { authorization: `Bearer ${t}` } : {} });
const verify = (r: Request) => verifyFirebaseToken(r, { projectId: PROJECT, getKey });
const rejects = async (p: Promise<unknown>, code: string) => {
  await assert.rejects(p, (e) => e instanceof HttpError && e.code === code);
};

Deno.test("firebase: a valid token is accepted and claims are read", async () => {
  const u = await verify(req(await token({ role: "authenticated", name: "Alice" })));
  assert.equal(u.uid, "uidA");
  assert.equal(u.email, "a@x.com");
  assert.equal(u.emailVerified, true);
  assert.equal(u.hasRoleClaim, true);
  assert.equal(u.name, "Alice");
});

Deno.test("firebase: email_verified false and a missing role claim are reported", async () => {
  const u = await verify(req(await token({ email_verified: false })));
  assert.equal(u.emailVerified, false);
  assert.equal(u.hasRoleClaim, false);
});

Deno.test("firebase: bad tokens are rejected", async () => {
  await rejects(verify(req()), "missing_token");
  await rejects(verify(req("not-a-jwt")), "invalid_token");
  await rejects(verify(req(await token({}, { aud: "someone-else" }))), "invalid_token");
  await rejects(verify(req(await token({}, { iss: "https://securetoken.google.com/other" }))), "invalid_token");
  await rejects(verify(req(await token({}, { exp: "-1h" }))), "invalid_token");
  await rejects(verify(req(await token({}, { key: other.privateKey }))), "invalid_token"); // signed by a stranger
});

Deno.test("email code: hash is bound to the user and the code", () => {
  const h = hashCode("uidA", "123456", "pepper");
  assert.equal(codesMatch(h, "uidA", "123456", "pepper"), true);
  assert.equal(codesMatch(h, "uidA", "123457", "pepper"), false);
  assert.equal(codesMatch(h, "uidB", "123456", "pepper"), false, "another account cannot reuse the row");
  assert.equal(codesMatch(h, "uidA", "123456", "other-pepper"), false);
});

Deno.test("email code: codes are six digits", () => {
  for (let i = 0; i < 200; i++) assert.match(newCode(), /^\d{6}$/);
});

Deno.test("ai draft: prohibited items are refused", () => {
  assert.throws(() => parseDraft(JSON.stringify({ title: "কিছু একটা", prohibited: true })), (e) => e instanceof HttpError && e.status === 422);
});

Deno.test("ai draft: output is cleaned", () => {
  const d = parseDraft(JSON.stringify({
    title: "  ক্লাস ৮-এর বইয়ের সেট  ",
    description: "ভালো অবস্থায়।".repeat(100),
    category: "weapons", // not an allowed value
    condition: "broken", // not an allowed value
    prohibited: false,
  }));
  assert.equal(d.title, "ক্লাস ৮-এর বইয়ের সেট");
  assert.ok(d.description.length <= 300);
  assert.equal(d.category, "other");
  assert.equal(d.condition, "good");
});

Deno.test("ai draft: junk replies are errors, not drafts", () => {
  assert.throws(() => parseDraft("not json"), (e) => e instanceof HttpError && e.code === "bad_ai_reply");
  assert.throws(() => parseDraft(JSON.stringify({ title: "ab" })), (e) => e instanceof HttpError && e.code === "bad_ai_reply");
});

Deno.test("ai draft: the request carries the images and a JSON schema", () => {
  const b = geminiBody([{ mime: "image/jpeg", data: "AAAA" }]);
  assert.equal(b.contents[0].parts.length, 2);
  assert.equal(b.generationConfig.responseMimeType, "application/json");
  assert.ok(b.generationConfig.responseSchema.properties.category.enum.includes("books"));
});

Deno.test("courier: Steadfast payload collects only the courier fee", () => {
  const p = steadfastPayload({
    id: "0123456789abcdef", exchange_id: "e", item: "বই", giver_name: "রাকিব", giver_address: "মিরপুর, ঢাকা",
    receiver_name: "ফাহিম", receiver_phone: "01811111111", receiver_address: "জিন্দাবাজার, সিলেট", charge: 130, weight_kg: 2,
  });
  assert.equal(p.invoice, "RD-01234567");
  assert.equal(p.cod_amount, 130);
  assert.equal(p.recipient_phone, "01811111111");
});

Deno.test("http: CORS reflects only listed origins", async () => {
  Deno.env.set("ALLOWED_ORIGINS", "https://www.reusedo.com, https://reusedo.com");
  const h = handler(() => Promise.resolve(new Response("ok")));
  const pre = (origin: string) => h(new Request("https://f", { method: "OPTIONS", headers: { origin } }));
  assert.equal((await pre("https://www.reusedo.com")).headers.get("access-control-allow-origin"), "https://www.reusedo.com");
  assert.equal((await pre("https://evil.example")).headers.get("access-control-allow-origin"), null);
  assert.equal((await h(new Request("https://f", { method: "GET" }))).status, 405);
});

Deno.test("http: HttpError becomes JSON, unexpected errors are hidden", async () => {
  const known = handler(() => Promise.reject(new HttpError(429, "cooldown")));
  const r = await known(new Request("https://f", { method: "POST" }));
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, "cooldown");
  const origErr = console.error;
  console.error = () => {};
  const boom = handler(() => Promise.reject(new Error("secret db password in message")));
  const b = await boom(new Request("https://f", { method: "POST" }));
  console.error = origErr;
  assert.equal(b.status, 500);
  assert.equal(JSON.stringify(await b.json()).includes("secret"), false);
});
