import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { api, closeDb, jpegWithExif, onboard, resetData, sql, token } from "./helpers";

// Courier flow with payment and fraud check, the admin queue that confirms it
// (Steadfast stubbed), and the admin tools around it.

const realFetch = globalThis.fetch;
const steadfastCalls: { url: string; body: unknown }[] = [];
vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
  const url = String(input);
  if (url.includes("packzy.com")) {
    steadfastCalls.push({ url, body: JSON.parse(String(init?.body ?? "{}")) });
    return new Response(
      JSON.stringify({
        status: 200,
        consignment: { consignment_id: 9001, tracking_code: "SF12345678" },
      }),
    );
  }
  if (url.includes("generativelanguage.googleapis.com")) {
    const draft = {
      title: "স্কুলের বইয়ের সেট",
      description: "ভালো অবস্থায়",
      category: "books",
      condition: "good",
      prohibited: false,
    };
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(draft) }] } }] }),
    );
  }
  return realFetch(input, init);
});

let giver: Awaited<ReturnType<typeof onboard>>;
let receiver: Awaited<ReturnType<typeof onboard>>;
let admin: Awaited<ReturnType<typeof onboard>>;
let moderator: Awaited<ReturnType<typeof onboard>>;
let exchangeId = "";
let courierId = "";
let postId = "";

beforeAll(async () => {
  await resetData();
  giver = await onboard("cgiver", { district: "ঢাকা", area: "মিরপুর ১০" }, { name: "Rakib Hasan" });
  receiver = await onboard(
    "crecv",
    { district: "সিলেট", area: "জিন্দাবাজার", phone: "01811000002" },
    { name: "Fahim Rahman" },
  );
  admin = await onboard("cadmin", { district: "ঢাকা", area: "গুলশান" }, { name: "Admin" });
  moderator = await onboard("cmod", { district: "ঢাকা", area: "বনানী" }, { name: "Mod" });
  await sql("update profiles set admin_role = 'super_admin' where firebase_uid = 'cadmin'");
  await sql("update profiles set admin_role = 'moderator' where firebase_uid = 'cmod'");
  const { forgetProfile } = await import("../src/middlewares/auth.middleware");
  forgetProfile("cadmin");
  forgetProfile("cmod");

  const post = await api()
    .post("/api/posts")
    .set("Authorization", giver.auth)
    .field(
      "data",
      JSON.stringify({
        kind: "offer",
        title: "ক্লাস ৮-এর বই",
        category: "books",
        delivery: ["courier"],
      }),
    )
    .attach("photos", jpegWithExif(), { filename: "a.jpg", contentType: "image/jpeg" })
    .expect(201);
  postId = post.body.data.id;
  const r = await api()
    .post(`/api/posts/${postId}/requests`)
    .set("Authorization", receiver.auth)
    .send({ via: "courier" })
    .expect(201);
  exchangeId = r.body.data.exchangeId;
  await api()
    .post(`/api/exchanges/${exchangeId}/advance`)
    .set("Authorization", giver.auth)
    .expect(200);
});
afterAll(closeDb);

describe("courier request", () => {
  const giverAddress = {
    name: "Rakib Hasan",
    phone: "01711000001",
    district: "ঢাকা",
    upazila: "মিরপুর",
    area: "মিরপুর ১০",
    line: "বাসা ১২, রোড ৩",
  };
  const receiverAddress = {
    name: "Fahim Rahman",
    phone: "01811000002",
    district: "সিলেট",
    upazila: "সিলেট সদর",
    area: "জিন্দাবাজার",
    line: "বাসা ৫, লেন ২",
  };

  it("needs the weight from the giver", async () => {
    const res = await api()
      .post(`/api/courier/${exchangeId}/agree`)
      .set("Authorization", giver.auth)
      .send(giverAddress)
      .expect(400);
    expect(res.body.code).toBe("weight_required");
  });

  it("can't be requested until both agree", async () => {
    await api()
      .post(`/api/courier/${exchangeId}/agree`)
      .set("Authorization", giver.auth)
      .send({ ...giverAddress, weightKg: 2.5 })
      .expect(200);
    const res = await api()
      .post(`/api/courier/${exchangeId}/request`)
      .set("Authorization", receiver.auth)
      .send({ method: "cod" })
      .expect(400);
    expect(res.body.code).toBe("both_must_agree");
  });

  it("computes the charge on the server and hides the other side's address", async () => {
    await api()
      .post(`/api/courier/${exchangeId}/agree`)
      .set("Authorization", receiver.auth)
      .send(receiverAddress)
      .expect(200);
    const res = await api()
      .get(`/api/courier/${exchangeId}`)
      .set("Authorization", receiver.auth)
      .expect(200);
    // Dhaka → Sylhet is outside Dhaka: 120 for the first kg + 2 extra kg × 20.
    expect(res.body.data).toMatchObject({
      zone: "outsideDhaka",
      weightKg: 2.5,
      charge: 160,
      giverAgreed: true,
      receiverAgreed: true,
    });
    expect(res.body.data.pickupArea).toBe("মিরপুর ১০, ঢাকা");
    expect(JSON.stringify(res.body.data)).not.toContain("বাসা ১২");
  });

  it("refuses a disabled payment method and sends a COD request to the queue", async () => {
    const bad = await api()
      .post(`/api/courier/${exchangeId}/request`)
      .set("Authorization", receiver.auth)
      .send({ method: "bkash", trxId: "BK7Q2M9X1A", senderNumber: "01811000002" })
      .expect(400);
    expect(bad.body.code).toBe("method_disabled");

    const res = await api()
      .post(`/api/courier/${exchangeId}/request`)
      .set("Authorization", receiver.auth)
      .send({ method: "cod" })
      .expect(201);
    courierId = res.body.data.requestId;
    expect(res.body.data).toMatchObject({
      charge: 160,
      payment: { method: "cod", status: "cod_due" },
    });

    const [risk] = await sql<{ status: string; signals: { key: string; result: string }[] }>(
      "select status, signals from risk_cases where courier_request_id = $1",
      [courierId],
    );
    // A brand-new account gets "fail" on age; the rest of this request is clean.
    expect(risk.signals.find((s) => s.key === "age")?.result).toBe("fail");
    expect(risk.signals.find((s) => s.key === "district")?.result).toBe("pass");
    expect(risk.status).toBe("open");
  });
});

describe("admin access", () => {
  it("is closed to normal users and limited for moderators", async () => {
    await api().get("/api/admin/stats").set("Authorization", giver.auth).expect(403);
    await api().get("/api/admin/stats").set("Authorization", moderator.auth).expect(200);
    await api().get("/api/admin/users").set("Authorization", moderator.auth).expect(403);
    await api().get("/api/admin/integrations").set("Authorization", moderator.auth).expect(403);
  });

  it("dashboard numbers come from the database", async () => {
    const res = await api().get("/api/admin/stats").set("Authorization", admin.auth).expect(200);
    expect(res.body.data).toMatchObject({
      users: 4,
      activePosts: 1,
      pendingCourier: 1,
      openRisk: 1,
    });
    expect(res.body.data.series).toHaveLength(14);
  });
});

describe("courier queue", () => {
  it("won't confirm before the fraud check is approved", async () => {
    const res = await api()
      .post(`/api/admin/courier-requests/${courierId}/decide`)
      .set("Authorization", admin.auth)
      .send({ decision: "confirmed" })
      .expect(409);
    expect(res.body.code).toBe("risk_not_approved");
  });

  it("creates the Steadfast parcel once approved and tells both people", async () => {
    const [risk] = await sql<{ id: string }>(
      "select id from risk_cases where courier_request_id = $1",
      [courierId],
    );
    await api()
      .patch(`/api/admin/risk/${risk.id}`)
      .set("Authorization", moderator.auth)
      .send({ status: "approved" })
      .expect(200);

    const res = await api()
      .post(`/api/admin/courier-requests/${courierId}/decide`)
      .set("Authorization", admin.auth)
      .send({ decision: "confirmed" })
      .expect(503);
    // No Steadfast keys yet: a clear error, nothing half-done.
    expect(res.body.code).toBe("steadfast_not_configured");

    await api()
      .patch("/api/admin/integrations/steadfast")
      .set("Authorization", admin.auth)
      .send({
        values: {
          apiKey: "sf-key-1234",
          secretKey: "sf-secret-5678",
          webhookToken: "hook-token-abcd",
        },
      })
      .expect(200);
    const done = await api()
      .post(`/api/admin/courier-requests/${courierId}/decide`)
      .set("Authorization", admin.auth)
      .send({ decision: "confirmed" })
      .expect(200);
    expect(done.body.data).toMatchObject({ status: "confirmed", tracking: "SF12345678" });
    expect(steadfastCalls[0].body).toMatchObject({
      recipient_phone: "01811000002",
      cod_amount: 160,
    });

    const notes = await api()
      .get("/api/notifications")
      .set("Authorization", receiver.auth)
      .expect(200);
    expect(notes.body.data[0].text).toContain("SF12345678");
  });

  it("stores integration secrets encrypted and never returns them", async () => {
    const res = await api()
      .get("/api/admin/integrations")
      .set("Authorization", admin.auth)
      .expect(200);
    const sf = res.body.data.find((i: { id: string }) => i.id === "steadfast");
    const key = sf.fields.find((f: { key: string }) => f.key === "apiKey");
    expect(key).toMatchObject({ set: true, last4: "1234" });
    expect(JSON.stringify(res.body)).not.toContain("sf-key-1234");
    const [row] = await sql<{ secret_values: unknown }>(
      "select secret_values from integration_settings where id = 'steadfast'",
    );
    expect(JSON.stringify(row.secret_values)).not.toContain("sf-key-1234");
  });

  it("takes delivery updates only with the webhook token", async () => {
    await api()
      .post("/api/webhooks/steadfast")
      .send({ consignment_id: 9001, status: "delivered" })
      .expect(401);
    await api()
      .post("/api/webhooks/steadfast")
      .set("Authorization", "Bearer hook-token-abcd")
      .send({ consignment_id: 9001, delivery_status: "delivered" })
      .expect(200);
    const [c] = await sql<{ delivery_status: string }>(
      "select delivery_status from courier_requests where id = $1",
      [courierId],
    );
    expect(c.delivery_status).toBe("delivered");
    const lookup = await api()
      .get("/api/admin/risk/phone/01811000002")
      .set("Authorization", admin.auth)
      .expect(200);
    expect(lookup.body.data).toMatchObject({
      valid: true,
      operator: "Robi",
      history: { total: 1, delivered: 1 },
    });
  });

  it("logs every admin action", async () => {
    const res = await api().get("/api/admin/audit").set("Authorization", admin.auth).expect(200);
    const actions = res.body.data.map((a: { action: string }) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining(["risk.approved", "integration.save", "courier.confirmed"]),
    );
    expect(JSON.stringify(res.body)).not.toContain("sf-key-1234");
  });
});

describe("payments", () => {
  it("rejects a reused bKash transaction ID", async () => {
    await api()
      .put("/api/admin/payment-settings")
      .set("Authorization", admin.auth)
      .send({
        methods: { cod: true, bkash: true, nagad: false },
        bkashNumber: "01700000000",
        nagadNumber: "",
        charges: { insideDhaka: 70, dhakaSuburb: 100, outsideDhaka: 120, perExtraKg: 20 },
        baseWeightKg: 1,
        advanceFrom: "high",
      })
      .expect(200);
    await sql(
      "insert into payments (payer_id, item, payer_name, phone, amount, method, trx_id, status) select id, 'x', 'x', '01811000002', 100, 'bkash', 'BK7Q2M9X1A', 'verified' from profiles limit 1",
    );

    const p2 = await api()
      .post("/api/posts")
      .set("Authorization", giver.auth)
      .field(
        "data",
        JSON.stringify({
          kind: "offer",
          title: "জ্যামিতি বক্স",
          category: "stationery",
          delivery: ["courier"],
        }),
      )
      .attach("photos", jpegWithExif(), { filename: "a.jpg", contentType: "image/jpeg" })
      .expect(201);
    const r = await api()
      .post(`/api/posts/${p2.body.data.id}/requests`)
      .set("Authorization", receiver.auth)
      .send({ via: "courier" })
      .expect(201);
    const ex = r.body.data.exchangeId;
    await api().post(`/api/exchanges/${ex}/advance`).set("Authorization", giver.auth).expect(200);
    await api()
      .post(`/api/courier/${ex}/agree`)
      .set("Authorization", giver.auth)
      .send({
        name: "Rakib",
        phone: "01711000001",
        district: "ঢাকা",
        upazila: "মিরপুর",
        area: "মিরপুর",
        line: "বাসা ১২, রোড ৩",
        weightKg: 1,
      })
      .expect(200);
    await api()
      .post(`/api/courier/${ex}/agree`)
      .set("Authorization", receiver.auth)
      .send({
        name: "Fahim",
        phone: "01811000002",
        district: "সিলেট",
        upazila: "সদর",
        area: "জিন্দাবাজার",
        line: "বাসা ৫, লেন ২",
      })
      .expect(200);
    const res = await api()
      .post(`/api/courier/${ex}/request`)
      .set("Authorization", receiver.auth)
      .send({ method: "bkash", trxId: "bk7q2m9x1a", senderNumber: "01811000002" })
      .expect(409);
    expect(res.body.code).toBe("trx_used");
  });

  it("needs a reason to reject a payment", async () => {
    const [p] = await sql<{ id: string }>("select id from payments where trx_id = 'BK7Q2M9X1A'");
    const res = await api()
      .patch(`/api/admin/payments/${p.id}`)
      .set("Authorization", admin.auth)
      .send({ status: "rejected" })
      .expect(400);
    expect(res.body.code).toBe("reason_required");
  });
});

describe("moderation", () => {
  it("resolving a report with hide hides the post and lowers trust", async () => {
    await api()
      .post("/api/reports")
      .set("Authorization", receiver.auth)
      .send({ targetType: "post", targetId: postId, reason: "fake_item", details: "" })
      .expect(201);
    const list = await api()
      .get("/api/admin/reports")
      .set("Authorization", moderator.auth)
      .expect(200);
    const report = list.body.data[0];
    expect(report).toMatchObject({
      targetType: "post",
      targetLabel: "ক্লাস ৮-এর বই",
      reporter: "Fahim Rahman",
    });
    const before = (await api().get(`/api/users/${giver.me.username}`).expect(200)).body.data.trust;
    await api()
      .patch(`/api/admin/reports/${report.id}`)
      .set("Authorization", moderator.auth)
      .send({ status: "resolved", hideTarget: true })
      .expect(200);
    await api().get(`/api/posts/${postId}`).expect(404);
    const after = (await api().get(`/api/users/${giver.me.username}`).expect(200)).body.data.trust;
    expect(after).toBe(before - 15);
  });

  it("moderators can't suspend people", async () => {
    await api()
      .patch(`/api/admin/users/${giver.me.id}/status`)
      .set("Authorization", moderator.auth)
      .send({ status: "suspended" })
      .expect(403);
  });

  it("flags switch features off for everyone", async () => {
    await api()
      .patch("/api/admin/flags/need_posts")
      .set("Authorization", admin.auth)
      .send({ enabled: false })
      .expect(200);
    const res = await api()
      .post("/api/posts")
      .set("Authorization", giver.auth)
      .send({
        data: JSON.stringify({
          kind: "need",
          title: "পড়ার টেবিল",
          category: "furniture",
          delivery: ["pickup"],
        }),
      })
      .expect(403);
    expect(res.body.code).toBe("need_posts_disabled");
  });

  it("CMS pages are public only once published", async () => {
    await api().get("/api/pages/terms").expect(404);
    await api()
      .put("/api/admin/pages/terms")
      .set("Authorization", admin.auth)
      .send({ title: "শর্তাবলী", body: "১. সব জিনিস বিনামূল্যে।", status: "published" })
      .expect(200);
    const res = await api().get("/api/pages/terms").expect(200);
    expect(res.body.data.body).toContain("বিনামূল্যে");
  });
});

describe("ads", () => {
  it("serves only active, targeted ads and counts one impression per session", async () => {
    await api()
      .put("/api/admin/ad-network")
      .set("Authorization", admin.auth)
      .send({
        adsEnabled: true,
        adxEnabled: false,
        networkCode: "",
        units: { feed: "", sidebar: "", post_detail: "" },
        every: 6,
        sessionCap: 8,
        newUserLight: true,
        priority: "direct_first",
      })
      .expect(200);
    await api()
      .patch("/api/admin/flags/ads_enabled")
      .set("Authorization", admin.auth)
      .send({ enabled: true })
      .expect(200);
    const base = {
      advertiser: "বইঘর",
      headline: "নতুন বই",
      body: "",
      cta: "দেখুন",
      url: "https://example.com",
      placements: ["feed"],
      categories: [],
      start: "2026-01-01",
      weight: 5,
      paused: false,
    };
    await api()
      .put("/api/admin/ads/new")
      .set("Authorization", admin.auth)
      .send({ ...base, districts: ["সিলেট"] })
      .expect(200);
    await api()
      .put("/api/admin/ads/new")
      .set("Authorization", admin.auth)
      .send({ ...base, headline: "বন্ধ", districts: [], paused: true })
      .expect(200);

    const dhaka = await api()
      .get(`/api/ads?placement=feed&district=${encodeURIComponent("ঢাকা")}`)
      .expect(200);
    expect(dhaka.body.data.ads).toHaveLength(0);
    const sylhet = await api()
      .get(`/api/ads?placement=feed&district=${encodeURIComponent("সিলেট")}`)
      .expect(200);
    expect(sylhet.body.data.ads).toHaveLength(1);
    expect(sylhet.body.data.ads[0]).not.toHaveProperty("impressions");

    const ad = sylhet.body.data.ads[0].id;
    for (let i = 0; i < 3; i++) {
      await api()
        .post(`/api/ads/${ad}/events`)
        .send({ type: "impression", session: "session-1234" })
        .expect(204);
    }
    const [row] = await sql<{ impressions: number }>(
      "select impressions from ad_campaigns where id = $1",
      [ad],
    );
    expect(row.impressions).toBe(1);
  });
});

describe("AI draft", () => {
  it("is unavailable without a key, then works and counts toward the daily limit", async () => {
    const photo = () =>
      api()
        .post("/api/ai/draft")
        .set("Authorization", giver.auth)
        .attach("photos", jpegWithExif(), { filename: "a.jpg", contentType: "image/jpeg" });
    const off = await photo().expect(503);
    expect(off.body.code).toBe("ai_unavailable");

    await api()
      .patch("/api/admin/integrations/gemini")
      .set("Authorization", admin.auth)
      .send({ values: { apiKey: "AIza-test-key" } })
      .expect(200);
    const ok = await photo().expect(200);
    expect(ok.body.data).toMatchObject({ category: "books", condition: "good" });

    await api()
      .put("/api/admin/settings")
      .set("Authorization", admin.auth)
      .send({
        supportEmail: "support@reusedo.app",
        aiDailyLimit: 1,
        maxPhotos: 5,
        requestExpiryDays: 7,
        maintenanceMode: false,
      })
      .expect(200);
    const limited = await photo().expect(429);
    expect(limited.body.code).toBe("ai_limit");
  });
});

describe("accounts", () => {
  it("deleting an account needs the username typed and removes the data", async () => {
    const u = await onboard("leaver", { district: "ঢাকা", area: "উত্তরা" });
    await api()
      .delete("/api/users/me")
      .set("Authorization", u.auth)
      .send({ confirm: "nope" })
      .expect(400);
    await api()
      .delete("/api/users/me")
      .set("Authorization", u.auth)
      .send({ confirm: u.me.username })
      .expect(200);
    const rows = await sql("select id from profiles where firebase_uid = 'leaver'");
    expect(rows).toHaveLength(0);
    // Signing in again starts a fresh, empty profile.
    await api().post("/api/auth/session").set("Authorization", token("leaver")).expect(200);
  });
});
