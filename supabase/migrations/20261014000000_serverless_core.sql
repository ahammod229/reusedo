-- ReuseDo — serverless core (no API server).
--
-- Identity comes from Firebase Auth: Supabase verifies the Firebase ID token (Third-party Auth) and exposes its
-- claims through auth.jwt(). `sub` is the Firebase uid (a string, NOT a uuid, so auth.uid() is never used here).
-- Browsers talk to Postgres directly, so EVERY rule below is the only thing standing between a user and the data:
--   * RLS is on for every table; tables a client may not write have no write policy at all.
--   * Anything that changes state across rows (requests, hand-over, courier, reports) is a SECURITY DEFINER function
--     that checks who is calling.
--   * Sensitive profile columns (role, trust, email, phone) are protected with column privileges + a public view.
--
-- Written for a FRESH Supabase project. It uses plain CREATE (not IF NOT EXISTS) on purpose: if old tables with the
-- same names exist (from the retired Express API), it fails loudly instead of silently keeping the old shape.

create extension if not exists pgcrypto with schema extensions;

-- ───────────────────────── identity helpers ─────────────────────────

create function public.fb_uid() returns text
language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

-- Firebase sets email_verified once the 6-digit code has been confirmed (or for Google sign-in).
create function public.email_ok() returns boolean
language sql stable as $$ select coalesce((auth.jwt() ->> 'email_verified')::boolean, false) $$;

create function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── reference data ─────────────────────────

create table public.districts (
  name text primary key,
  lat double precision not null,
  lng double precision not null
);
insert into public.districts (name, lat, lng) values
  ('ঢাকা', 23.81, 90.41),
  ('গাজীপুর', 24.0, 90.42),
  ('নারায়ণগঞ্জ', 23.62, 90.5),
  ('নরসিংদী', 23.92, 90.72),
  ('মানিকগঞ্জ', 23.86, 90.0),
  ('মুন্সিগঞ্জ', 23.55, 90.53),
  ('টাঙ্গাইল', 24.25, 89.92),
  ('কিশোরগঞ্জ', 24.43, 90.78),
  ('ফরিদপুর', 23.6, 89.84),
  ('গোপালগঞ্জ', 23.01, 89.83),
  ('মাদারীপুর', 23.17, 90.2),
  ('রাজবাড়ী', 23.76, 89.64),
  ('শরীয়তপুর', 23.21, 90.35),
  ('চট্টগ্রাম', 22.36, 91.78),
  ('কক্সবাজার', 21.43, 92.01),
  ('কুমিল্লা', 23.46, 91.18),
  ('ব্রাহ্মণবাড়িয়া', 23.97, 91.11),
  ('চাঁদপুর', 23.23, 90.66),
  ('ফেনী', 23.02, 91.4),
  ('নোয়াখালী', 22.87, 91.1),
  ('লক্ষ্মীপুর', 22.94, 90.84),
  ('খাগড়াছড়ি', 23.12, 91.98),
  ('রাঙ্গামাটি', 22.65, 92.17),
  ('বান্দরবান', 22.19, 92.22),
  ('রাজশাহী', 24.37, 88.6),
  ('বগুড়া', 24.85, 89.37),
  ('জয়পুরহাট', 25.1, 89.02),
  ('নওগাঁ', 24.8, 88.93),
  ('নাটোর', 24.41, 88.98),
  ('চাঁপাইনবাবগঞ্জ', 24.6, 88.28),
  ('পাবনা', 24.0, 89.23),
  ('সিরাজগঞ্জ', 24.45, 89.7),
  ('খুলনা', 22.82, 89.55),
  ('বাগেরহাট', 22.65, 89.79),
  ('চুয়াডাঙ্গা', 23.64, 88.85),
  ('যশোর', 23.17, 89.21),
  ('ঝিনাইদহ', 23.54, 89.17),
  ('কুষ্টিয়া', 23.9, 89.12),
  ('মাগুরা', 23.49, 89.42),
  ('মেহেরপুর', 23.76, 88.63),
  ('নড়াইল', 23.17, 89.5),
  ('সাতক্ষীরা', 22.72, 89.07),
  ('বরিশাল', 22.7, 90.37),
  ('বরগুনা', 22.16, 90.12),
  ('ভোলা', 22.69, 90.65),
  ('ঝালকাঠি', 22.64, 90.2),
  ('পটুয়াখালী', 22.36, 90.33),
  ('পিরোজপুর', 22.58, 89.97),
  ('সিলেট', 24.9, 91.87),
  ('হবিগঞ্জ', 24.38, 91.42),
  ('মৌলভীবাজার', 24.48, 91.77),
  ('সুনামগঞ্জ', 25.07, 91.4),
  ('রংপুর', 25.75, 89.25),
  ('দিনাজপুর', 25.63, 88.64),
  ('গাইবান্ধা', 25.33, 89.53),
  ('কুড়িগ্রাম', 25.81, 89.65),
  ('লালমনিরহাট', 25.99, 89.45),
  ('নীলফামারী', 25.93, 88.86),
  ('পঞ্চগড়', 26.34, 88.55),
  ('ঠাকুরগাঁও', 26.03, 88.46),
  ('ময়মনসিংহ', 24.75, 90.41),
  ('জামালপুর', 24.92, 89.94),
  ('নেত্রকোণা', 24.87, 90.73),
  ('শেরপুর', 25.02, 90.01);

-- Rough distance used for "near me" ordering. Same upazila ≈ 2 km, same district ≈ 12 km, otherwise the
-- great-circle distance between district centres. It is an estimate: no street addresses are stored on posts.
create function public.distance_km(a_district text, a_upazila text, b_district text, b_upazila text)
returns double precision language plpgsql stable as $$
declare a public.districts; b public.districts;
begin
  if a_district is null or b_district is null then return 100; end if;
  if a_district = b_district then
    if a_upazila is not null and a_upazila = b_upazila then return 2; end if;
    return 12;
  end if;
  select * into a from public.districts where name = a_district;
  select * into b from public.districts where name = b_district;
  if a.name is null or b.name is null then return 200; end if;
  return 6371 * 2 * asin(sqrt(
    power(sin(radians(b.lat - a.lat) / 2), 2) +
    cos(radians(a.lat)) * cos(radians(b.lat)) * power(sin(radians(b.lng - a.lng) / 2), 2)));
end $$;

-- ───────────────────────── profiles ─────────────────────────

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  email text,
  display_name text not null default 'User' check (char_length(display_name) between 1 and 80),
  username text unique check (username ~ '^[a-z0-9_]{3,30}$'),
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_url text,
  phone_number text check (phone_number ~ '^01[3-9][0-9]{8}$'),
  division text, district text references public.districts(name), upazila text, area text,
  edu_level text check (edu_level in ('primary','junior','ssc','hsc','admission','university')),
  institution text,
  show_institution boolean not null default false,
  show_on_map boolean not null default false,
  preferred_language text not null default 'bn' check (preferred_language in ('bn','en')),
  role text not null default 'user' check (role in ('user','admin')),
  admin_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Looked up by every policy, so it must bypass profiles' own RLS (security definer) to avoid recursion.
create function public.my_pid() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where firebase_uid = public.fb_uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where firebase_uid = public.fb_uid() and role = 'admin')
$$;

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated
  using (firebase_uid = public.fb_uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (firebase_uid = public.fb_uid()) with check (firebase_uid = public.fb_uid());
-- No INSERT/DELETE policy: profiles are created by ensure_profile() only.

-- Creates the caller's profile on first sign-in. Refuses until the email code has been confirmed.
create function public.ensure_profile() returns public.profiles
language plpgsql security definer set search_path = public as $$
declare me public.profiles; base text; candidate text; n int := 0;
begin
  if public.fb_uid() is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if not public.email_ok() then raise exception 'email_not_verified' using errcode = '28000'; end if;
  select * into me from public.profiles where firebase_uid = public.fb_uid();
  if found then return me; end if;
  base := regexp_replace(lower(split_part(coalesce(auth.jwt() ->> 'email', 'user'), '@', 1)), '[^a-z0-9_]', '', 'g');
  if char_length(base) < 3 then base := base || 'user'; end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1; candidate := base || n::text;
  end loop;
  insert into public.profiles (firebase_uid, email, display_name, username, avatar_url)
  values (public.fb_uid(), auth.jwt() ->> 'email',
          left(coalesce(nullif(auth.jwt() ->> 'name', ''), split_part(coalesce(auth.jwt() ->> 'email', 'User'), '@', 1)), 80),
          candidate, auth.jwt() ->> 'picture')
  returning * into me;
  return me;
end $$;

-- ───────────────────────── posts ─────────────────────────

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('offer','need')),
  title text not null check (char_length(title) between 5 and 80),
  description text not null default '' check (char_length(description) <= 500),
  category text not null check (category in ('books','stationery','furniture','clothes','electronics','kids','other')),
  condition text not null default 'good' check (condition in ('new','good','used')),
  area text not null default '',
  district text not null references public.districts(name),
  upazila text,
  images text[] not null default '{}' check (cardinality(images) <= 5),
  edu_level text check (edu_level in ('primary','junior','ssc','hsc','admission','university')),
  edu_detail text check (char_length(edu_detail) <= 80),
  delivery text[] not null default '{pickup}'
    check (cardinality(delivery) > 0 and delivery <@ array['pickup','courier']::text[]),
  urgency text check (urgency in ('urgent','soon','anytime')),
  qty int check (qty between 1 and 1000),
  status text not null default 'available' check (status in ('available','reserved','given','archived')),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts (created_at desc) where not hidden and status <> 'archived';
create index posts_owner_idx on public.posts (owner_id);
create index posts_district_idx on public.posts (district);
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- At most 20 new posts a day per person: keeps spam cheap to stop without an API server.
create function public.posts_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.posts where owner_id = new.owner_id and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger posts_rate before insert on public.posts
  for each row execute function public.posts_rate_limit();

alter table public.posts enable row level security;
create policy posts_select on public.posts for select to anon, authenticated
  using ((not hidden and status <> 'archived') or owner_id = public.my_pid() or public.is_admin());
create policy posts_insert on public.posts for insert to authenticated
  with check (
    owner_id = public.my_pid() and public.email_ok() and not hidden and status = 'available'
    and exists (select 1 from public.profiles p where p.id = owner_id and p.district is not null and p.phone_number is not null)
  );
create policy posts_update_own on public.posts for update to authenticated
  using (owner_id = public.my_pid()) with check (owner_id = public.my_pid());
create policy posts_delete_own on public.posts for delete to authenticated
  using (owner_id = public.my_pid() or public.is_admin());

-- Owners may change status only between available / reserved / archived; "given" is set by the hand-over function.
create function public.set_post_status(p_post uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('available','reserved','archived') then raise exception 'bad_status'; end if;
  update public.posts set status = p_status
   where id = p_post and owner_id = public.my_pid() and status <> 'given';
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
end $$;

-- Admin moderation.
create function public.admin_set_post_hidden(p_post uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.posts set hidden = p_hidden where id = p_post;
end $$;

-- ───────────────────────── exchanges (a request and what follows) ─────────────────────────

create table public.exchanges (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  giver_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested','accepted','scheduled','completed','cancelled')),
  via text not null default 'pickup' check (via in ('pickup','courier')),
  message text not null default '' check (char_length(message) <= 300),
  courier_ok_giver boolean not null default false,
  courier_ok_receiver boolean not null default false,
  conversation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, receiver_id),
  check (giver_id <> receiver_id)
);
create index exchanges_giver_idx on public.exchanges (giver_id);
create index exchanges_receiver_idx on public.exchanges (receiver_id);
create trigger exchanges_touch before update on public.exchanges
  for each row execute function public.touch_updated_at();

alter table public.exchanges enable row level security;
create policy exchanges_select on public.exchanges for select to authenticated
  using (giver_id = public.my_pid() or receiver_id = public.my_pid() or public.is_admin());
-- No write policies: only the functions below change exchanges.

-- Hand-over codes live apart so no select policy can ever expose them.
create table public.exchange_secrets (
  exchange_id uuid primary key references public.exchanges(id) on delete cascade,
  handover_code text not null,
  attempts int not null default 0
);
alter table public.exchange_secrets enable row level security;

create function public.post_request_count(p_post uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.exchanges where post_id = p_post and status <> 'cancelled'
$$;

-- ───────────────────────── chat ─────────────────────────

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete set null,
  exchange_id uuid references public.exchanges(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch',   -- nothing read yet, so a first message counts as unread
  primary key (conversation_id, profile_id)
);
create index conversation_members_profile_idx on public.conversation_members (profile_id);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,  -- null = system message
  kind text not null default 'text' check (kind in ('text','system')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create function public.is_member(p_conversation uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members
                  where conversation_id = p_conversation and profile_id = public.my_pid())
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
create policy conversations_select on public.conversations for select to authenticated
  using (public.is_member(id));
create policy members_select on public.conversation_members for select to authenticated
  using (public.is_member(conversation_id));
create policy messages_select on public.messages for select to authenticated
  using (public.is_member(conversation_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (kind = 'text' and sender_id = public.my_pid() and public.is_member(conversation_id) and public.email_ok());

create function public.messages_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  -- The very first message comes with the request, which already notifies the giver; notify from the second on.
  if new.kind = 'text' and exists (select 1 from public.messages
                                    where conversation_id = new.conversation_id and kind = 'text' and id <> new.id) then
    insert into public.notifications (profile_id, kind, text_bn, text_en, route)
    select m.profile_id, 'message',
           (select display_name from public.profiles where id = new.sender_id) || ' আপনাকে মেসেজ পাঠিয়েছেন',
           (select display_name from public.profiles where id = new.sender_id) || ' sent you a message',
           '/messages/' || new.conversation_id
      from public.conversation_members m
     where m.conversation_id = new.conversation_id and m.profile_id <> new.sender_id;
  end if;
  return new;
end $$;

create function public.mark_conversation_read(p_conversation uuid) returns void
language sql security definer set search_path = public as $$
  update public.conversation_members set last_read_at = now()
   where conversation_id = p_conversation and profile_id = public.my_pid()
$$;

-- ───────────────────────── notifications ─────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('request','accepted','message','courier','match','review')),
  text_bn text not null,
  text_en text not null,
  route text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications for select to authenticated
  using (profile_id = public.my_pid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (profile_id = public.my_pid()) with check (profile_id = public.my_pid());

create trigger messages_after after insert on public.messages
  for each row execute function public.messages_after_insert();

-- ───────────────────────── thanks, reports, saved, courier ─────────────────────────

create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null unique references public.exchanges(id) on delete cascade,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  item text not null default '',                -- the item's title, kept so a thank-you still reads well later
  created_at timestamptz not null default now()
);
alter table public.thanks enable row level security;
create policy thanks_select on public.thanks for select to anon, authenticated using (true);  -- thank-yous are public by design

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reason text not null check (reason in ('spam','fraud','fake_item','inappropriate','sold','other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, post_id)
);
alter table public.reports enable row level security;
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = public.my_pid() or public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.saved_posts (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);
alter table public.saved_posts enable row level security;
create policy saved_all_own on public.saved_posts for all to authenticated
  using (profile_id = public.my_pid()) with check (profile_id = public.my_pid());

create table public.courier_requests (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null unique references public.exchanges(id) on delete cascade,
  item text not null,
  category text not null default 'other',
  giver_name text not null, giver_phone text, giver_address text not null,
  receiver_name text not null, receiver_phone text, receiver_address text not null,
  weight_kg numeric not null default 2,
  charge int not null,                              -- taka, paid by the receiver on delivery (COD)
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  tracking_code text,                               -- Steadfast consignment, set when an admin confirms
  admin_note text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.courier_requests enable row level security;
create policy courier_select on public.courier_requests for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.exchanges e
     where e.id = exchange_id and (e.giver_id = public.my_pid() or e.receiver_id = public.my_pid())));
-- Confirm / reject goes through the admin-courier Edge Function (it needs the Steadfast secret keys).

-- Small key/value settings (ad network, courier prices). Public to read, admin to write. Never put secrets here.
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;
create policy settings_read on public.platform_settings for select to anon, authenticated using (true);
create policy settings_write on public.platform_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Server-only tables (Edge Functions use the service-role key, which bypasses RLS; clients get nothing).
create table public.email_verification_codes (
  firebase_uid text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  last_sent_at timestamptz not null default now()
);
alter table public.email_verification_codes enable row level security;
create table public.ai_usage (
  firebase_uid text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (firebase_uid, day)
);
alter table public.ai_usage enable row level security;

-- Daily AI-draft counter, called only by the ai-draft Edge Function (service role). Returns the new count.
create function public.bump_ai_usage(p_uid text) returns int
language sql security definer set search_path = public as $$
  insert into public.ai_usage (firebase_uid, day, count) values (p_uid, current_date, 1)
  on conflict (firebase_uid, day) do update set count = public.ai_usage.count + 1
  returning count
$$;
revoke execute on function public.bump_ai_usage(text) from public, anon, authenticated;

-- ───────────────────────── notification helper ─────────────────────────

create function public.notify(p_to uuid, p_kind text, p_bn text, p_en text, p_route text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, kind, text_bn, text_en, route) values (p_to, p_kind, p_bn, p_en, p_route)
$$;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- ───────────────────────── views the app reads ─────────────────────────

-- What anyone may see about a person. Runs with the view owner's rights so it can read profiles past RLS,
-- but exposes no email, phone, role, or exact address.
create view public.public_profiles as
select p.id, p.username, p.display_name, p.avatar_url, p.bio, p.district, p.upazila, p.area, p.created_at,
       p.edu_level,
       case when p.show_institution then p.institution end as institution,
       (p.phone_number is not null and p.district is not null) as verified,
       s.given, s.received, s.thanks_received, s.thanks_written, s.given_by_category,
       least(100, 30 + s.given * 4 + s.thanks_received * 2 + s.received)::int as trust
  from public.profiles p
  cross join lateral (
    select
      (select count(*) from public.exchanges e where e.giver_id = p.id and e.status = 'completed')::int as given,
      (select count(*) from public.exchanges e where e.receiver_id = p.id and e.status = 'completed')::int as received,
      (select count(*) from public.thanks t where t.to_id = p.id)::int as thanks_received,
      (select count(*) from public.thanks t where t.from_id = p.id)::int as thanks_written,
      -- {"books": 3, "clothes": 1}: lets the app estimate kg saved without exposing who got what
      (select coalesce(jsonb_object_agg(c.category, c.n), '{}'::jsonb) from (
         select po.category, count(*)::int as n
           from public.exchanges e join public.posts po on po.id = e.post_id
          where e.giver_id = p.id and e.status = 'completed' group by po.category) c) as given_by_category
  ) s;

-- Where the caller lives, for distance. A function (not a join on profiles) so guests can browse the feed too.
create function public.my_location(out district text, out upazila text)
language sql stable security definer set search_path = public as $$
  select district, upazila from public.profiles where firebase_uid = public.fb_uid()
$$;

-- The feed: posts plus author facts and distance from the caller (security_invoker: posts' RLS applies).
create view public.feed_posts with (security_invoker = true) as
select p.*,
       a.display_name as author_name, a.username as author_username,
       a.verified as author_verified, a.trust as author_trust,
       public.post_request_count(p.id) as requests,
       public.distance_km(me.district, me.upazila, p.district, p.upazila) as distance_km,
       (p.owner_id = public.my_pid()) as mine
  from public.posts p
  join public.public_profiles a on a.id = p.owner_id
  cross join lateral public.my_location() me;

-- The caller's chats with the last message and unread count.
create view public.my_chats with (security_invoker = true) as
select c.id, c.post_id, c.exchange_id, c.last_message_at,
       po.title as post_title, po.kind as post_kind,
       other.id as other_id, other.display_name as other_name, other.verified as other_verified,
       (select body from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_body,
       (select count(*) from public.messages m
         where m.conversation_id = c.id and m.kind = 'text'
           and m.sender_id is distinct from public.my_pid() and m.created_at > mm.last_read_at)::int as unread
  from public.conversations c
  join public.conversation_members mm on mm.conversation_id = c.id and mm.profile_id = public.my_pid()
  left join public.posts po on po.id = c.post_id
  left join lateral (
    select pp.id, pp.display_name, pp.verified
      from public.conversation_members om
      join public.public_profiles pp on pp.id = om.profile_id
     where om.conversation_id = c.id and om.profile_id <> public.my_pid() limit 1
  ) other on true;

-- ───────────────────────── request / accept / hand-over ─────────────────────────

create function public.request_post(p_post uuid, p_message text default '', p_via text default 'pickup') returns uuid
language plpgsql security definer set search_path = public as $$
declare me public.profiles; po public.posts; giver uuid; receiver uuid; ex uuid; conv uuid; who text;
begin
  select * into me from public.profiles where firebase_uid = public.fb_uid();
  if not found or not public.email_ok() then raise exception 'not_allowed' using errcode = '42501'; end if;
  if me.district is null or me.phone_number is null then raise exception 'profile_incomplete'; end if;
  select * into po from public.posts where id = p_post and not hidden and status = 'available';
  if not found then raise exception 'post_unavailable'; end if;
  if po.owner_id = me.id then raise exception 'own_post'; end if;
  if not (p_via = any (po.delivery)) then raise exception 'delivery_not_offered'; end if;
  if (select count(*) from public.exchanges where (giver_id = me.id or receiver_id = me.id)
        and created_at > now() - interval '24 hours') >= 30 then
    raise exception 'rate_limited';
  end if;
  if po.kind = 'offer' then giver := po.owner_id; receiver := me.id; else giver := me.id; receiver := po.owner_id; end if;

  insert into public.exchanges (post_id, giver_id, receiver_id, via, message)
  values (po.id, giver, receiver, p_via, left(coalesce(p_message, ''), 300))
  returning id into ex;      -- unique (post_id, receiver_id) rejects a second request

  insert into public.conversations (post_id, exchange_id) values (po.id, ex) returning id into conv;
  insert into public.conversation_members (conversation_id, profile_id) values (conv, giver), (conv, receiver);
  insert into public.messages (conversation_id, kind, body)
  values (conv, 'system', 'রিকোয়েস্ট পাঠানো হয়েছে।');
  if coalesce(p_message, '') <> '' then
    insert into public.messages (conversation_id, sender_id, body) values (conv, me.id, left(p_message, 1000));
  end if;
  update public.exchanges set conversation_id = conv where id = ex;

  who := me.display_name;
  perform public.notify(po.owner_id, 'request',
    who || ' আপনার “' || po.title || '” পোস্টে সাড়া দিয়েছেন',
    who || ' responded to “' || po.title || '”', '/exchanges');
  return ex;
end $$;

create function public.accept_exchange(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e public.exchanges;
begin
  select * into e from public.exchanges where id = p_id and giver_id = public.my_pid() and status = 'requested';
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.exchanges set status = 'accepted' where id = p_id;
  update public.posts set status = 'reserved' where id = e.post_id and status = 'available';
  perform public.notify(e.receiver_id, 'accepted', 'আপনার রিকোয়েস্ট গ্রহণ করা হয়েছে',
                        'Your request was accepted', '/exchanges');
end $$;

create function public.schedule_exchange(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.exchanges set status = 'scheduled'
   where id = p_id and status = 'accepted' and (giver_id = public.my_pid() or receiver_id = public.my_pid());
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
end $$;

create function public.cancel_exchange(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e public.exchanges;
begin
  select * into e from public.exchanges
   where id = p_id and status in ('requested','accepted','scheduled')
     and (giver_id = public.my_pid() or receiver_id = public.my_pid());
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.exchanges set status = 'cancelled' where id = p_id;
  -- Free the post again if nobody else is mid-exchange on it.
  update public.posts set status = 'available'
   where id = e.post_id and status = 'reserved'
     and not exists (select 1 from public.exchanges x where x.post_id = e.post_id and x.id <> p_id
                      and x.status in ('accepted','scheduled'));
end $$;

-- Giver only. The code is created on first ask and kept until the exchange completes.
create function public.get_handover_code(p_id uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare e public.exchanges; code text;
begin
  select * into e from public.exchanges
   where id = p_id and giver_id = public.my_pid() and via = 'pickup' and status in ('accepted','scheduled');
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  select handover_code into code from public.exchange_secrets where exchange_id = p_id;
  if code is null then
    code := (1000 + (get_byte(extensions.gen_random_bytes(2), 0) * 256 + get_byte(extensions.gen_random_bytes(2), 1)) % 9000)::text;
    insert into public.exchange_secrets (exchange_id, handover_code) values (p_id, code);
  end if;
  return code;
end $$;

-- Receiver only. Returns 'ok' | 'wrong' | 'locked' (a result, not an exception, so the attempt count survives).
create function public.confirm_handover(p_id uuid, p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare e public.exchanges; s public.exchange_secrets;
begin
  select * into e from public.exchanges
   where id = p_id and receiver_id = public.my_pid() and via = 'pickup' and status in ('accepted','scheduled');
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into s from public.exchange_secrets where exchange_id = p_id for update;
  if not found then return 'wrong'; end if;           -- the giver has not opened a code yet
  if s.attempts >= 5 then return 'locked'; end if;
  if s.handover_code <> coalesce(p_code, '') then
    update public.exchange_secrets set attempts = attempts + 1 where exchange_id = p_id;
    return case when s.attempts + 1 >= 5 then 'locked' else 'wrong' end;
  end if;
  update public.exchanges set status = 'completed' where id = p_id;
  update public.posts set status = 'given' where id = e.post_id;
  delete from public.exchange_secrets where exchange_id = p_id;
  insert into public.messages (conversation_id, kind, body)
  select conversation_id, 'system', 'আদান-প্রদান সম্পন্ন হয়েছে।' from public.exchanges where id = p_id and conversation_id is not null;
  perform public.notify(e.giver_id, 'review', 'আদান-প্রদান সম্পন্ন হয়েছে — ধন্যবাদ!',
                        'Exchange completed — thank you!', '/exchanges');
  return 'ok';
end $$;

create function public.send_thanks(p_id uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare e public.exchanges;
begin
  select * into e from public.exchanges where id = p_id and receiver_id = public.my_pid() and status = 'completed';
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  insert into public.thanks (exchange_id, from_id, to_id, body, item)
  values (p_id, e.receiver_id, e.giver_id, left(coalesce(nullif(trim(p_text), ''), '🙏'), 200),
          (select title from public.posts where id = e.post_id))
  on conflict (exchange_id) do nothing;
  perform public.notify(e.giver_id, 'review', 'আপনি একটি ধন্যবাদ পেয়েছেন 💌', 'You received a thank-you 💌', '/profile');
end $$;

create function public.report_post(p_post uuid, p_reason text, p_details text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_pid() is null or not public.email_ok() then raise exception 'not_allowed' using errcode = '42501'; end if;
  insert into public.reports (reporter_id, post_id, reason, details)
  values (public.my_pid(), p_post, p_reason, left(coalesce(p_details, ''), 500))
  on conflict (reporter_id, post_id) do nothing;
end $$;

-- Each side agrees to courier delivery; when both have, the request lands in the admin queue.
create function public.agree_courier(p_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare e public.exchanges; g public.profiles; r public.profiles; po public.posts; a record;
begin
  select * into e from public.exchanges
   where id = p_id and via = 'courier' and status in ('accepted','scheduled')
     and (giver_id = public.my_pid() or receiver_id = public.my_pid());
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  if e.giver_id = public.my_pid() then
    update public.exchanges set courier_ok_giver = true where id = p_id;
  else
    update public.exchanges set courier_ok_receiver = true where id = p_id;
  end if;
  select * into e from public.exchanges where id = p_id;
  if not (e.courier_ok_giver and e.courier_ok_receiver) then return 'waiting'; end if;
  if exists (select 1 from public.courier_requests where exchange_id = p_id) then return 'sent'; end if;
  select * into g from public.profiles where id = e.giver_id;
  select * into r from public.profiles where id = e.receiver_id;
  select * into po from public.posts where id = e.post_id;
  if g.phone_number is null or r.phone_number is null then raise exception 'profile_incomplete'; end if;
  insert into public.courier_requests (exchange_id, item, category, giver_name, giver_phone, giver_address,
                                       receiver_name, receiver_phone, receiver_address, charge)
  values (p_id, po.title, po.category, g.display_name, g.phone_number,
          concat_ws(', ', g.area, g.upazila, g.district),
          r.display_name, r.phone_number, concat_ws(', ', r.area, r.upazila, r.district),
          case when g.district = r.district then 80 else 130 end);
  for a in select id from public.profiles where role = 'admin' loop
    perform public.notify(a.id, 'courier', 'নতুন কুরিয়ার রিকোয়েস্ট এসেছে', 'A new courier request arrived', '/admin/courier');
  end loop;
  return 'sent';
end $$;

-- ───────────────────────── dashboard + map ─────────────────────────

create function public.my_counts() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'requestsToAnswer', (select count(*) from public.exchanges where giver_id = public.my_pid() and status = 'requested'),
    'unreadMessages', (select coalesce(sum(unread), 0) from public.my_chats),
    'activeExchanges', (select count(*) from public.exchanges
                         where (giver_id = public.my_pid() or receiver_id = public.my_pid()) and status in ('accepted','scheduled')),
    'thanksToWrite', coalesce((
        select jsonb_agg(jsonb_build_object('exchangeId', e.id, 'item', po.title, 'to', gp.display_name))
          from public.exchanges e
          join public.posts po on po.id = e.post_id
          join public.profiles gp on gp.id = e.giver_id
         where e.receiver_id = public.my_pid() and e.status = 'completed'
           and not exists (select 1 from public.thanks t where t.exchange_id = e.id)), '[]'::jsonb),
    'activeNearby', (select count(distinct x.id) from public.profiles x
                      where x.district = (select district from public.profiles where id = public.my_pid())
                        and x.updated_at > now() - interval '7 days')
  )
$$;

-- Per-district giving, for the Home map. District level only. A person's first name appears only if they chose to
-- ("show on map") and their district has at least 3 donors, so a small district never points at one household.
create function public.donation_map() returns jsonb
language sql stable security definer set search_path = public as $$
  with done as (
    select e.updated_at as at, g.district, g.id as giver, g.display_name, g.show_on_map, po.title
      from public.exchanges e
      join public.profiles g on g.id = e.giver_id
      join public.posts po on po.id = e.post_id
     where e.status = 'completed' and g.district is not null
  ), hubs as (
    select district,
           count(distinct giver)::int as donors,
           count(*) filter (where at >= date_trunc('month', now()))::int as items,
           coalesce(bool_or(at > now() - interval '24 hours'), false) as fresh
      from done group by district
  )
  select jsonb_build_object(
    'hubs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'district', h.district, 'donors', h.donors, 'items', h.items, 'fresh', h.fresh,
        'recent', case when h.donors >= 3 then coalesce((
            select jsonb_agg(jsonb_build_object('name', split_part(d.display_name, ' ', 1), 'item', d.title, 'at', d.at))
              from (select * from done d2 where d2.district = h.district and d2.show_on_map
                     order by d2.at desc limit 1) d), '[]'::jsonb) else '[]'::jsonb end))
      from hubs h), '[]'::jsonb),
    'givenToday', (select count(*) from done where at >= date_trunc('day', now())),
    'givenThisMonth', (select count(*) from done where at >= date_trunc('month', now())),
    'districtsActive', (select count(*) from hubs)
  )
$$;

-- ───────────────────────── privileges ─────────────────────────
-- Start from nothing, then grant exactly what the app needs. RLS above still applies to every grant.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Readable by everyone (guests can browse the feed).
grant select on public.districts, public.posts, public.thanks, public.platform_settings,
                public.public_profiles, public.feed_posts to anon, authenticated;
grant execute on function public.donation_map(), public.distance_km(text, text, text, text), public.my_location(),
                          public.fb_uid(), public.email_ok(), public.my_pid(), public.is_admin(),
                          public.post_request_count(uuid) to anon, authenticated;

-- Signed-in only.
grant select on public.profiles, public.exchanges, public.conversations, public.conversation_members,
                public.messages, public.notifications, public.reports, public.saved_posts,
                public.courier_requests, public.my_chats to authenticated;
-- Column-level: people can edit their own profile text but never role / email / ids.
grant update (display_name, username, bio, avatar_url, phone_number, division, district, upazila, area,
              edu_level, institution, show_institution, show_on_map, preferred_language)
  on public.profiles to authenticated;
grant insert (owner_id, kind, title, description, category, condition, area, district, upazila, images,
              edu_level, edu_detail, delivery, urgency, qty) on public.posts to authenticated;
grant update (title, description, category, condition, area, district, upazila, images,
              edu_level, edu_detail, delivery, urgency, qty) on public.posts to authenticated;
grant delete on public.posts to authenticated;
grant insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert, delete on public.saved_posts to authenticated;
grant update (status) on public.reports to authenticated;
grant insert, update, delete on public.platform_settings to authenticated;

grant execute on function public.ensure_profile(), public.set_post_status(uuid, text),
  public.admin_set_post_hidden(uuid, boolean), public.is_member(uuid), public.mark_conversation_read(uuid),
  public.request_post(uuid, text, text), public.accept_exchange(uuid), public.schedule_exchange(uuid),
  public.cancel_exchange(uuid), public.get_handover_code(uuid), public.confirm_handover(uuid, text),
  public.send_thanks(uuid, text), public.report_post(uuid, text, text), public.agree_courier(uuid),
  public.my_counts() to authenticated;

-- ───────────────────────── realtime + storage ─────────────────────────
-- Realtime respects the select policies above, so people only receive their own chats and notifications.
alter publication supabase_realtime add table public.messages, public.notifications;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- Anyone can view; people can upload/delete only inside their own folder (named after their Firebase uid).
create policy post_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and public.email_ok() and (storage.foldername(name))[1] = public.fb_uid());
create policy post_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = public.fb_uid());
