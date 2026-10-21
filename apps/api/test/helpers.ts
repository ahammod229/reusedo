import { Client } from "pg";
import request from "supertest";
import { app } from "../src/server";

export const api = () => request(app);

/** A fake signed-in user. Unverified users can read but not write. */
export const token = (uid: string, opts: { verified?: boolean; name?: string } = {}) =>
  `Bearer test:${JSON.stringify({
    uid,
    email: `${uid}@example.com`,
    email_verified: opts.verified ?? true,
    name: opts.name ?? uid,
  })}`;

let client: Client | null = null;
export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (!client) {
    client = new Client({ connectionString: process.env.TEST_DB_URL });
    await client.connect();
  }
  return (await client.query(text, params)).rows as T[];
}

/** Empties every table that tests write to; the seeded defaults stay. */
export async function resetData() {
  // DELETE (not TRUNCATE … CASCADE): settings rows reference profiles with ON DELETE SET
  // NULL, and a cascading truncate would wipe the seeded settings along with the people.
  await sql("delete from profiles");
  await sql(
    "truncate blocklist, ad_events, ad_campaigns, audit_logs, integration_settings, email_verification_codes",
  );
  await sql(`update feature_flags set enabled = key <> 'ads_enabled' and key <> 'chat_images'`);
  await sql(`update cms_pages set status = 'draft', body = ''`);
  await sql(
    `update platform_settings set value = value || '{"aiDailyLimit": 15}' where key = 'general'`,
  );
  await sql(
    `update platform_settings set value = value || '{"methods": {"cod": true, "bkash": false, "nagad": false}}' where key = 'payments'`,
  );
  await sql(
    `update platform_settings set value = value || '{"adsEnabled": false}' where key = 'ad_network'`,
  );
}

export async function closeDb() {
  await client?.end();
  client = null;
}

/** Signs a user in and completes onboarding (area + phone), like the web flow does. */
export async function onboard(
  uid: string,
  where: { district: string; area: string; pin?: [number, number]; phone?: string },
  opts: { verified?: boolean; name?: string } = {},
) {
  const auth = token(uid, opts);
  await api().post("/api/auth/session").set("Authorization", auth).expect(200);
  const res = await api()
    .patch("/api/users/me")
    .set("Authorization", auth)
    .send({
      district: where.district,
      area: where.area,
      upazila: where.area,
      phone: where.phone ?? `017${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
      ...(where.pin && { pin: where.pin }),
    })
    .expect(200);
  return { auth, me: res.body.data as { id: string; username: string } };
}

// Smallest valid JPEG (1×1), with an EXIF APP1 segment carrying a fake GPS marker.
export const jpegWithExif = () => {
  const exif = Buffer.concat([
    Buffer.from([0xff, 0xe1, 0x00, 0x10]),
    Buffer.from("Exif\0\0GPSDATA!"),
    Buffer.from([0x00]),
  ]);
  const body = Buffer.from(
    "ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffda0008010100003f00fbd3ffd9",
    "hex",
  );
  return Buffer.concat([Buffer.from([0xff, 0xd8]), exif, body]);
};
