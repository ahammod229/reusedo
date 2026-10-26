-- Supabase projects made after 2026-05-30 no longer grant new public tables to the
-- Data API roles by default (changelog #45329), so PostgREST can't see them.
-- Only the API's service_role needs them: the browser never reads the database
-- (RLS is on everywhere with no policies), so anon/authenticated stay without grants.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Same for anything later migrations create.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;
