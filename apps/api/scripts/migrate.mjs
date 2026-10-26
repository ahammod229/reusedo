// Applies supabase/migrations/*.sql that haven't run yet, in name order, each in its own
// transaction, and records them in public.schema_migrations. Runs as the API's Vercel
// build step, where the Supabase integration's connection string is available (it is
// hidden everywhere else). With no connection string it does nothing.
//
//   node scripts/migrate.mjs            (DATABASE_URL or reusedo_POSTGRES_URL_NON_POOLING)

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../supabase/migrations");
const raw = process.env.DATABASE_URL || process.env.reusedo_POSTGRES_URL_NON_POOLING;

if (!raw) {
  console.log("[migrate] no database URL, skipping");
  process.exit(0);
}

// Supabase's certificate chain isn't in Node's store; the connection is still encrypted.
const url = new URL(raw);
url.searchParams.delete("sslmode");
url.searchParams.delete("supa");
const local = ["localhost", "127.0.0.1"].includes(url.hostname);
const db = new pg.Client({
  connectionString: url.toString(),
  ssl: local ? false : { rejectUnauthorized: false },
});

await db.connect();
try {
  await db.query(`create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`);
  await db.query("alter table public.schema_migrations enable row level security");

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const done = new Set(
    (await db.query("select name from public.schema_migrations")).rows.map((r) => r.name),
  );

  // A database set up by hand before this script existed already has the baseline.
  const [baseline] = files;
  if (!done.has(baseline)) {
    const { rows } = await db.query("select to_regclass('public.profiles') is not null as has");
    if (rows[0].has) {
      await db.query("insert into public.schema_migrations (name) values ($1)", [baseline]);
      done.add(baseline);
      console.log(`[migrate] ${baseline}: already in place, recorded`);
    }
  }

  for (const f of files) {
    if (done.has(f)) continue;
    await db.query("begin");
    try {
      await db.query(readFileSync(join(DIR, f), "utf8"));
      await db.query("insert into public.schema_migrations (name) values ($1)", [f]);
      await db.query("commit");
      console.log(`[migrate] ${f}: applied`);
    } catch (e) {
      await db.query("rollback");
      console.error(`[migrate] ${f}: FAILED — ${e.message}`);
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) console.log("[migrate] database is up to date");
} finally {
  await db.end();
}
