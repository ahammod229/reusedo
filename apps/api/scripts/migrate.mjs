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
  // What the API will see: same project, tables there, service_role allowed in, schemas exposed.
  const ref = process.env.reusedo_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1];
  const { rows: diag } = await db.query(`select
      (select count(*) from pg_tables where schemaname = 'public')::int as tables,
      has_table_privilege('service_role', 'public.categories', 'select') as service_role_can_read,
      (select array_to_string(rolconfig, ' ') from pg_roles where rolname = 'authenticator') as authenticator_config`);
  console.log(
    `[migrate] check: same project as API: ${ref ? raw.includes(ref) : "unknown"}, ` +
      `public tables: ${diag[0].tables}, service_role can read: ${diag[0].service_role_can_read}, ` +
      `authenticator: ${diag[0].authenticator_config ?? "(defaults)"}`,
  );
  const { rows: rest } = await db.query(`select
      (select string_agg(distinct coalesce(nullif(application_name, ''), usename::text) || ':' || state, ', ')
         from pg_stat_activity where usename = 'authenticator') as postgrest_sessions,
      (select string_agg(evtname, ', ') from pg_event_trigger) as event_triggers,
      has_schema_privilege('anon', 'public', 'usage') as anon_schema_usage,
      has_table_privilege('anon', 'public.categories', 'select') as anon_can_read,
      has_table_privilege('authenticated', 'public.categories', 'select') as authenticated_can_read,
      has_function_privilege('service_role', 'public.feed(uuid,text,text,text,text,text,text[],text,integer,boolean,boolean,boolean,boolean,text,uuid,uuid[],integer,integer)', 'execute') as service_role_can_run_feed`);
  console.log(`[migrate] postgrest: ${JSON.stringify(rest[0])}`);
  // PostgREST settings kept inside the database (role settings or a pre-config function).
  const { rows: cfg } = await db.query(`select
      (select string_agg(n.nspname || '.' || p.proname || ': ' || left(regexp_replace(pg_get_functiondef(p.oid), '\\s+', ' ', 'g'), 400), ' | ')
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('postgrest', 'pgrst') or p.proname ilike '%pre_config%') as pre_config,
      (select string_agg(r.rolname || '=' || array_to_string(s.setconfig, ' '), ' | ')
         from pg_db_role_setting s left join pg_roles r on r.oid = s.setrole
        where array_to_string(s.setconfig, ' ') ilike '%pgrst%') as pgrst_settings`);
  console.log(`[migrate] postgrest config: ${JSON.stringify(cfg[0])}`);
  const { rows: dbs } = await db.query(`select current_database() as migrated_into,
      (select string_agg(distinct datname, ', ') from pg_stat_activity where usename = 'authenticator') as postgrest_reads,
      (select string_agg(datname, ', ') from pg_database where not datistemplate) as all_databases`);
  console.log(`[migrate] databases: ${JSON.stringify(dbs[0])}`);
  // PostgREST lists a table only if its login role passes these checks (SchemaCache allTables).
  const { rows: own } = await db.query(`select current_user as migrated_as,
      (select tableowner from pg_tables where schemaname = 'public' and tablename = 'categories') as owner,
      (select tableowner from pg_tables where schemaname = 'storage' and tablename = 'buckets') as storage_owner,
      (select rolinherit from pg_roles where rolname = 'authenticator') as authenticator_inherits,
      (select string_agg(b.rolname, ',') from pg_auth_members m join pg_roles a on a.oid = m.member
         join pg_roles b on b.oid = m.roleid where a.rolname = 'authenticator') as authenticator_member_of,
      pg_has_role('authenticator', (select tableowner from pg_tables where schemaname = 'public' and tablename = 'categories'), 'USAGE') as auth_usage_owner,
      has_table_privilege('authenticator', 'public.categories', 'select') as auth_table_priv`);
  console.log(`[migrate] ownership: ${JSON.stringify(own[0])}`);

  // The API reads through PostgREST, which caches the table list: make it look again.
  await db.query("notify pgrst, 'reload config'");
  await db.query("notify pgrst, 'reload schema'");
  await new Promise((r) => setTimeout(r, 5000));
  const { rows: sessions } = await db.query(`select pid, state, wait_event_type, wait_event,
      now() - backend_start as age, left(regexp_replace(query, '\\s+', ' ', 'g'), 120) as query
    from pg_stat_activity where usename = 'authenticator'`);
  console.log(`[migrate] postgrest sessions: ${JSON.stringify(sessions)}`);

  const apiUrl = process.env.SUPABASE_URL || process.env.reusedo_SUPABASE_URL;
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.reusedo_SUPABASE_SERVICE_ROLE_KEY;
  if (apiUrl && apiKey) {
    const h = { apikey: apiKey, Authorization: `Bearer ${apiKey}` };
    const one = await fetch(`${apiUrl}/rest/v1/categories?select=id&limit=1`, { headers: h });
    console.log(`[migrate] rest categories: ${one.status} ${(await one.text()).slice(0, 300)}`);
    const root = await fetch(`${apiUrl}/rest/v1/`, { headers: h });
    const body = await root.text();
    let paths = body.slice(0, 200);
    try {
      paths = Object.keys(JSON.parse(body).paths ?? {})
        .slice(0, 12)
        .join(" ");
    } catch {}
    console.log(`[migrate] rest root: ${root.status} ${paths}`);
    // An unknown profile makes PostgREST list the schemas it exposes.
    const prof = await fetch(`${apiUrl}/rest/v1/categories?select=id&limit=1`, {
      headers: { ...h, "Accept-Profile": "no_such_schema" },
    });
    console.log(`[migrate] rest schemas: ${prof.status} ${(await prof.text()).slice(0, 300)}`);

    // Still blind: drop PostgREST's database sessions. It reconnects on its own and
    // rebuilds the schema cache from scratch when it does.
    if (one.status === 404) {
      const { rows: killed } = await db.query(
        "select count(*) filter (where pg_terminate_backend(pid))::int as n from pg_stat_activity where usename = 'authenticator'",
      );
      console.log(`[migrate] restarted ${killed[0].n} PostgREST session(s)`);
      await new Promise((r) => setTimeout(r, 10000));
      const again = await fetch(`${apiUrl}/rest/v1/categories?select=id&limit=1`, { headers: h });
      console.log(
        `[migrate] rest categories after restart: ${again.status} ${(await again.text()).slice(0, 200)}`,
      );
    }
  }

  if (!process.exitCode) console.log("[migrate] database is up to date");
} finally {
  await db.end();
}
