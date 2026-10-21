import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api, closeDb, jpegWithExif, onboard, resetData, sql, token } from "./helpers";

// One gift from start to finish: post → request → accept → handover code → thanks,
// checking the side effects (notifications, chat, post status, trust, map) on the way.

const MIRPUR: [number, number] = [23.807, 90.368];
const DHANMONDI: [number, number] = [23.746, 90.376];

let giver: Awaited<ReturnType<typeof onboard>>;
let receiver: Awaited<ReturnType<typeof onboard>>;
let postId = "";
let exchangeId = "";
let conversationId = "";

beforeAll(async () => {
  await resetData();
  giver = await onboard("giver1", { district: "ঢাকা", area: "মিরপুর ১০", pin: MIRPUR }, { name: "Rakib Hasan" });
  receiver = await onboard("recv1", { district: "ঢাকা", area: "ধানমন্ডি", pin: DHANMONDI }, { name: "Fahim Rahman" });
});
afterAll(closeDb);

describe("posting", () => {
  it("rejects an offer without a photo", async () => {
    const res = await api()
      .post("/api/posts")
      .set("Authorization", giver.auth)
      .field("data", JSON.stringify({ kind: "offer", title: "ক্লাস ৮-এর বই", category: "books", delivery: ["pickup"] }))
      .expect(400);
    expect(res.body.code).toBe("photo_required");
  });

  it("creates an offer, stores the photo without EXIF, and copies the owner's area", async () => {
    const res = await api()
      .post("/api/posts")
      .set("Authorization", giver.auth)
      .field(
        "data",
        JSON.stringify({
          kind: "offer",
          title: "ক্লাস ৮-এর সব বই (সেট)",
          description: "ভালো অবস্থায় আছে",
          category: "books",
          condition: "good",
          edu: { level: "junior", detail: "ক্লাস ৮ · বাংলা ভার্সন" },
          delivery: ["pickup", "courier"],
        }),
      )
      .attach("photos", jpegWithExif(), { filename: "a.jpg", contentType: "image/jpeg" })
      .expect(201);
    const p = res.body.data;
    postId = p.id;
    expect(p).toMatchObject({ kind: "offer", district: "ঢাকা", area: "মিরপুর ১০", status: "available", requests: 0 });
    expect(p.author.username).toBe(giver.me.username);
    expect(p.images).toHaveLength(1);

    const stored = Buffer.from(await (await fetch(p.images[0])).arrayBuffer());
    expect(stored.subarray(0, 2).toString("hex")).toBe("ffd8");
    expect(stored.includes(Buffer.from("GPSDATA"))).toBe(false);
  });

  it("refuses writes from accounts that haven't confirmed their email", async () => {
    const auth = token("unverified1", { verified: false });
    const res = await api().post("/api/posts").set("Authorization", auth).send({}).expect(403);
    expect(res.body.code).toBe("email_not_verified");
  });
});

describe("feed", () => {
  it("is public and filters in SQL", async () => {
    const all = await api().get("/api/feed").expect(200);
    expect(all.body.data.map((p: { id: string }) => p.id)).toContain(postId);

    const needs = await api().get("/api/feed?kind=need").expect(200);
    expect(needs.body.data).toHaveLength(0);

    const q = await api().get(`/api/feed?q=${encodeURIComponent("বাংলা ভার্সন")}`).expect(200);
    expect(q.body.data).toHaveLength(1);

    const level = await api().get("/api/feed?level=hsc").expect(200);
    expect(level.body.data).toHaveLength(0);
  });

  it("gives signed-in viewers a distance, rounded", async () => {
    const res = await api().get("/api/feed?scope=district").set("Authorization", receiver.auth).expect(200);
    const p = res.body.data.find((x: { id: string }) => x.id === postId);
    expect(p.distanceKm).toBeGreaterThan(5);
    expect(p.distanceKm).toBeLessThan(10);
  });

  it("'my area' means within 5 km", async () => {
    const res = await api().get("/api/feed?scope=area").set("Authorization", receiver.auth).expect(200);
    expect(res.body.data.map((x: { id: string }) => x.id)).not.toContain(postId);
  });
});

describe("request → accept → handover", () => {
  it("can't request your own post", async () => {
    const res = await api()
      .post(`/api/posts/${postId}/requests`)
      .set("Authorization", giver.auth)
      .send({ via: "pickup" })
      .expect(400);
    expect(res.body.code).toBe("own_post");
  });

  it("creates an exchange, a chat and a notification", async () => {
    const res = await api()
      .post(`/api/posts/${postId}/requests`)
      .set("Authorization", receiver.auth)
      .send({ via: "pickup", message: "আমার ছোট ভাইয়ের জন্য দরকার" })
      .expect(201);
    exchangeId = res.body.data.exchangeId;
    conversationId = res.body.data.conversationId;

    const notes = await api().get("/api/notifications").set("Authorization", giver.auth).expect(200);
    expect(notes.body.data[0]).toMatchObject({ kind: "request", unread: true, href: "/exchanges" });

    const chats = await api().get("/api/chat").set("Authorization", giver.auth).expect(200);
    const chat = chats.body.data[0];
    expect(chat).toMatchObject({ id: conversationId, with: "Fahim Rahman", postTitle: "ক্লাস ৮-এর সব বই (সেট)", unread: 1 });
    expect(chat.messages.map((m: { from: string }) => m.from)).toEqual(["system", "them"]);
  });

  it("refuses a second open request from the same person", async () => {
    const res = await api()
      .post(`/api/posts/${postId}/requests`)
      .set("Authorization", receiver.auth)
      .send({ via: "pickup" })
      .expect(409);
    expect(res.body.success).toBe(false);
  });

  it("lets only the other side accept", async () => {
    const mine = await api().get("/api/exchanges").set("Authorization", receiver.auth).expect(200);
    expect(mine.body.data[0]).toMatchObject({ role: "receiver", status: "requested", canAccept: false, conversationId });

    await api().post(`/api/exchanges/${exchangeId}/advance`).set("Authorization", receiver.auth).expect(403);
    const ok = await api().post(`/api/exchanges/${exchangeId}/advance`).set("Authorization", giver.auth).expect(200);
    expect(ok.body.data.status).toBe("accepted");

    const post = await api().get(`/api/posts/${postId}`).expect(200);
    expect(post.body.data.status).toBe("reserved");
  });

  it("hides exchanges from people who aren't in them", async () => {
    const stranger = await onboard("stranger1", { district: "সিলেট", area: "জিন্দাবাজার" });
    await api().get(`/api/exchanges/${exchangeId}/handover-code`).set("Authorization", stranger.auth).expect(404);
    await api()
      .post(`/api/chat/${conversationId}/messages`)
      .set("Authorization", stranger.auth)
      .send({ text: "hi" })
      .expect(404);
  });

  it("completes with the giver's code; wrong codes are counted", async () => {
    await api().get(`/api/exchanges/${exchangeId}/handover-code`).set("Authorization", receiver.auth).expect(403);
    const code = (await api().get(`/api/exchanges/${exchangeId}/handover-code`).set("Authorization", giver.auth).expect(200))
      .body.data.code as string;
    expect(code).toMatch(/^\d{4}$/);

    const wrong = code === "1234" ? "4321" : "1234";
    const bad = await api()
      .post(`/api/exchanges/${exchangeId}/handover`)
      .set("Authorization", receiver.auth)
      .send({ code: wrong })
      .expect(400);
    expect(bad.body.code).toBe("wrong_code");
    const [row] = await sql<{ handover_attempts: number }>("select handover_attempts from exchanges where id = $1", [
      exchangeId,
    ]);
    expect(row.handover_attempts).toBe(1);

    const done = await api()
      .post(`/api/exchanges/${exchangeId}/handover`)
      .set("Authorization", receiver.auth)
      .send({ code })
      .expect(200);
    expect(done.body.data.status).toBe("completed");

    const post = await api().get(`/api/posts/${postId}`).expect(200);
    expect(post.body.data.status).toBe("given");
    // Given posts leave the default feed.
    const feed = await api().get("/api/feed").expect(200);
    expect(feed.body.data.map((p: { id: string }) => p.id)).not.toContain(postId);
  });
});

describe("after the handover", () => {
  it("receiver thanks the giver once; it shows on the giver's profile", async () => {
    await api()
      .post(`/api/exchanges/${exchangeId}/thanks`)
      .set("Authorization", receiver.auth)
      .send({ text: "অনেক কাজে লেগেছে, ধন্যবাদ!", stars: 5 })
      .expect(201);
    await api()
      .post(`/api/exchanges/${exchangeId}/thanks`)
      .set("Authorization", receiver.auth)
      .send({ text: "আবার", stars: 5 })
      .expect(409);

    const profile = await api().get(`/api/users/${giver.me.username}`).expect(200);
    const p = profile.body.data;
    expect(p.thanks[0]).toMatchObject({ by: "Fahim Rahman", item: "ক্লাস ৮-এর সব বই (সেট)" });
    expect(p.stats).toMatchObject({ given: 1, booksGiven: 1, thanksReceived: 1, localHelped: 1, givenByCategory: { books: 1 } });
    expect(p.badges).toEqual(["email", "phone", "address"]);
    // 50 base + 10 verified + 5 per gift + 2 per thanks note.
    expect(p.trust).toBe(67);
    expect(p).not.toHaveProperty("phone");
    expect(JSON.stringify(p)).not.toContain("@example.com");
  });

  it("the exchange now reads as thanked for the receiver", async () => {
    const res = await api().get("/api/exchanges").set("Authorization", receiver.auth).expect(200);
    expect(res.body.data[0]).toMatchObject({ status: "completed", thanked: true });
  });

  it("the donation map counts the district but hides names below 3 donors", async () => {
    await sql("update profiles set show_on_map = true where firebase_uid = 'giver1'");
    const res = await api().get("/api/stats/donation-map").expect(200);
    expect(res.body.data).toMatchObject({ givenToday: 1, districtsActive: 1 });
    expect(res.body.data.hubs[0]).toMatchObject({ district: "ঢাকা", donors: 1, items: 1, fresh: true, recent: [] });
  });

  it("dashboard has nothing left to do for either side", async () => {
    const res = await api().get("/api/me/dashboard").set("Authorization", receiver.auth).expect(200);
    expect(res.body.data.todo).toEqual({ requestsToAnswer: 0, unreadMessages: 0, activeExchanges: 0, thanksToWrite: [] });
    expect(res.body.data.activeNearby).toBeGreaterThanOrEqual(2);
  });
});

describe("moderation and safety", () => {
  it("reports are accepted once while open", async () => {
    const body = { targetType: "post", targetId: postId, reason: "spam", details: "x" };
    await api().post("/api/reports").set("Authorization", receiver.auth).send(body).expect(201);
    await api().post("/api/reports").set("Authorization", receiver.auth).send(body).expect(201);
    const rows = await sql("select id from reports where target_id = $1", [postId]);
    expect(rows).toHaveLength(1);
  });

  it("hidden posts disappear and the owner can't un-hide them", async () => {
    await sql("update posts set status = 'hidden' where id = $1", [postId]);
    await api().get(`/api/posts/${postId}`).expect(404);
    const res = await api()
      .patch(`/api/posts/${postId}`)
      .set("Authorization", giver.auth)
      .send({ status: "available" })
      .expect(403);
    expect(res.body.code).toBe("post_hidden");
  });

  it("suspended accounts can read but not write", async () => {
    await sql("update profiles set status = 'suspended' where firebase_uid = 'recv1'");
    // The profile cache keeps the old status for up to a minute; a new uid avoids that here.
    const s = await onboard("susp1", { district: "ঢাকা", area: "উত্তরা" });
    await sql("update profiles set status = 'suspended' where firebase_uid = 'susp1'");
    const { forgetProfile } = await import("../src/middlewares/auth.middleware");
    forgetProfile("susp1");
    await api().get("/api/notifications").set("Authorization", s.auth).expect(200);
    const res = await api().post("/api/reports").set("Authorization", s.auth).send({}).expect(403);
    expect(res.body.code).toBe("suspended");
  });

  it("rejects invalid phone numbers and blocked ones", async () => {
    const bad = await api().patch("/api/users/me").set("Authorization", giver.auth).send({ phone: "12345" }).expect(400);
    expect(bad.body.code).toBe("validation");
    await sql("insert into blocklist (type, value, reason) values ('phone', '01999999999', 'fraud')");
    const blocked = await api()
      .patch("/api/users/me")
      .set("Authorization", giver.auth)
      .send({ phone: "+880 1999-999999" })
      .expect(403);
    expect(blocked.body.code).toBe("phone_blocked");
  });

  it("unknown API paths answer JSON 404", async () => {
    const res = await api().get("/api/nope").expect(404);
    expect(res.body).toMatchObject({ success: false, code: "not_found" });
  });
});
