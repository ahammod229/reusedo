-- ReuseDo baseline schema.
--
-- Replaces the earlier M01–M16 files, which referenced tables that never existed
-- (public.users, needs) and modelled barter instead of free giving.
--
-- Access model: every table has RLS on and no policies, so only the API (service
-- role) can read or write. The browser never talks to the database directly.

create extension if not exists pg_trgm;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text not null default '',
  display_name text not null,
  username text unique not null,
  avatar_url text,
  bio text not null default '',
  phone_number text,
  division text,
  district text,
  upazila text,
  area text,
  -- Rounded to ~100 m on the client; never shown, only used for distance.
  area_lat double precision,
  area_lng double precision,
  level text check (level in ('primary', 'junior', 'ssc', 'hsc', 'admission', 'university')),
  institution text not null default '',
  -- Off by default: many users are minors (docs/STUDENT_UX.md §3).
  show_institution boolean not null default false,
  interests text[] not null default '{}',
  -- Opt-in to appear by first name on the Home donation map.
  show_on_map boolean not null default false,
  email_verified_at timestamptz,
  is_verified boolean generated always as (
    email_verified_at is not null and phone_number is not null and district is not null
  ) stored,
  trust_score integer not null default 50 check (trust_score between 0 and 100),
  admin_role text check (admin_role in ('super_admin', 'admin', 'moderator')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_district_idx on public.profiles (district);
create index profiles_phone_idx on public.profiles (phone_number);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  language text not null default 'bn' check (language in ('bn', 'en')),
  notify_push boolean not null default true,
  notify_email boolean not null default true,
  -- "area" | "district" | "country": how far away new matching posts notify me.
  notify_scope text not null default 'district' check (notify_scope in ('area', 'district', 'country')),
  allow_messages boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Full addresses are only used for courier pickups and never shown publicly.
create table public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'home',
  recipient_name text not null,
  phone text not null,
  district text not null,
  upazila text not null,
  area text not null,
  line text not null default '',
  landmark text,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_addresses_user_idx on public.user_addresses (user_id);
create trigger user_addresses_touch before update on public.user_addresses
  for each row execute function public.touch_updated_at();

create table public.email_verification_codes (
  firebase_uid text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  last_sent_at timestamptz not null default now()
);

create table public.fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  device_info text,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

-- ---------------------------------------------------------------------------
-- Posts: one table for offers ("I'm giving") and needs ("I need")
-- ---------------------------------------------------------------------------

create table public.categories (
  id text primary key,
  name_bn text not null,
  name_en text not null,
  emoji text not null default '🎁',
  enabled boolean not null default true,
  sort integer not null default 100
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('offer', 'need')),
  title varchar(150) not null,
  description text not null default '',
  category_id text not null references public.categories (id),
  condition text not null default 'good' check (condition in ('new', 'good', 'used')),
  -- Copied from the owner's profile when posting, so moving later doesn't move old posts.
  district text not null,
  area text not null default '',
  area_lat double precision,
  area_lng double precision,
  images text[] not null default '{}',
  edu_level text check (edu_level in ('primary', 'junior', 'ssc', 'hsc', 'admission', 'university')),
  edu_detail text,
  delivery text[] not null default '{pickup}',
  urgency text check (urgency in ('urgent', 'soon', 'anytime')),
  qty integer check (qty is null or qty > 0),
  -- available → reserved (a request was accepted) → given. hidden/deleted = moderation.
  status text not null default 'available'
    check (status in ('available', 'reserved', 'given', 'hidden', 'deleted')),
  request_count integer not null default 0,
  view_count integer not null default 0,
  given_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivery <@ array['pickup', 'courier']::text[] and cardinality(delivery) > 0)
);
create index posts_feed_idx on public.posts (status, created_at desc);
create index posts_owner_idx on public.posts (owner_id);
create index posts_district_idx on public.posts (district);
create index posts_category_idx on public.posts (category_id);
create index posts_text_idx on public.posts
  using gin ((title || ' ' || description || ' ' || coalesce(edu_detail, '')) gin_trgm_ops);
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts (id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  unread_count integer not null default 0,
  archived boolean not null default false,
  muted boolean not null default false,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  -- Null for system messages ("you sent a request on this post").
  sender_id uuid references public.profiles (id) on delete set null,
  type text not null default 'text' check (type in ('text', 'image', 'system')),
  content text not null,
  metadata jsonb,
  -- clock_timestamp, not now(): several messages written in one transaction (a request's
  -- system line + first message) must still sort in the order they were sent.
  created_at timestamptz not null default clock_timestamp()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Exchanges: a request on a post, from "requested" to "completed"
-- ---------------------------------------------------------------------------

create table public.exchanges (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  giver_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  -- Who pressed "I want this" / "I have this".
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'scheduled', 'completed', 'cancelled')),
  via text not null default 'pickup' check (via in ('pickup', 'courier')),
  message text not null default '',
  conversation_id uuid references public.conversations (id) on delete set null,
  -- Pickup handover: the giver reads a 4-digit code aloud, the receiver types it.
  handover_code_hash text,
  handover_attempts integer not null default 0,
  -- Courier: each side agrees and leaves a private address snapshot
  -- ({ name, phone, district, upazila, area, line, agreedAt }). Never shown to the other side.
  giver_courier jsonb,
  receiver_courier jsonb,
  courier_weight_kg numeric(5, 2) check (courier_weight_kg is null or courier_weight_kg > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (giver_id <> receiver_id)
);
-- One open request per person per post.
create unique index exchanges_one_open_idx on public.exchanges (post_id, requested_by)
  where status <> 'cancelled';
create index exchanges_giver_idx on public.exchanges (giver_id);
create index exchanges_receiver_idx on public.exchanges (receiver_id);
create trigger exchanges_touch before update on public.exchanges
  for each row execute function public.touch_updated_at();

create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid unique not null references public.exchanges (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  text varchar(500) not null,
  created_at timestamptz not null default now()
);
create index thanks_to_idx on public.thanks (to_id, created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  unique (exchange_id, reviewer_id)
);
create index reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('request', 'accepted', 'message', 'courier', 'match', 'review')),
  text text not null,
  href text not null default '/',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Trust & safety
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'user', 'message', 'review')),
  target_id uuid not null,
  reason text not null
    check (reason in ('spam', 'fraud', 'abuse', 'fake_item', 'inappropriate', 'sold', 'other')),
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_target_idx on public.reports (target_type, target_id);
create unique index reports_once_idx on public.reports (reporter_id, target_type, target_id)
  where status in ('open', 'investigating');
create trigger reports_touch before update on public.reports
  for each row execute function public.touch_updated_at();

-- Accounts that automatic checks flagged for a human look (no ID documents are collected).
create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles (id) on delete cascade,
  flags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.blocklist (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('phone', 'email', 'device', 'address')),
  value text not null,
  reason text not null default '',
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (type, value)
);

-- ---------------------------------------------------------------------------
-- Courier, payments, risk
-- ---------------------------------------------------------------------------

create table public.courier_requests (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid unique not null references public.exchanges (id) on delete cascade,
  item text not null,
  category_id text not null references public.categories (id),
  -- Snapshots at request time: { name, phone, address }.
  giver jsonb not null,
  receiver jsonb not null,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  zone text not null check (zone in ('insideDhaka', 'dhakaSuburb', 'outsideDhaka')),
  -- Computed on the server from the rate card; never trusted from the client.
  charge integer not null check (charge >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  tracking text,
  consignment_id text,
  -- From Steadfast after confirmation.
  delivery_status text check (delivery_status in ('in_review', 'picked_up', 'in_transit', 'delivered', 'returned', 'cancelled')),
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  courier_request_id uuid references public.courier_requests (id) on delete set null,
  payer_id uuid not null references public.profiles (id) on delete cascade,
  item text not null,
  payer_name text not null,
  phone text not null,
  amount integer not null check (amount >= 0),
  method text not null check (method in ('cod', 'bkash', 'nagad')),
  trx_id text,
  sender_number text,
  status text not null
    check (status in ('pending', 'verified', 'rejected', 'refunded', 'cod_due', 'cod_collected')),
  flags text[] not null default '{}',
  note text,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- A transaction ID can only pay once.
create unique index payments_trx_idx on public.payments (method, upper(trx_id)) where trx_id is not null;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

create table public.risk_cases (
  id uuid primary key default gen_random_uuid(),
  courier_request_id uuid references public.courier_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item text not null,
  signals jsonb not null default '[]',
  history jsonb,
  status text not null default 'open' check (status in ('open', 'approved', 'held', 'rejected')),
  note text,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ads
-- ---------------------------------------------------------------------------

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null,
  headline text not null,
  body text not null default '',
  cta text not null default '',
  url text not null check (url ~* '^https?://'),
  image text,
  placements text[] not null default '{feed}',
  districts text[] not null default '{}',
  categories text[] not null default '{}',
  start_date date not null default current_date,
  end_date date,
  weight integer not null default 5 check (weight between 1 and 10),
  paused boolean not null default false,
  impressions integer not null default 0,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

-- One impression and one click per ad per browser session.
create table public.ad_events (
  ad_id uuid not null references public.ad_campaigns (id) on delete cascade,
  type text not null check (type in ('impression', 'click')),
  session_id text not null,
  created_at timestamptz not null default now(),
  primary key (ad_id, type, session_id)
);

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text not null default '',
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.cms_pages (
  slug text primary key,
  title text not null,
  body text not null default '',
  status text not null default 'draft' check (status in ('published', 'draft')),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger cms_pages_touch before update on public.cms_pages
  for each row execute function public.touch_updated_at();

-- One JSON value per key: "general", "ad_network", "payments".
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.feature_flags (
  key text primary key,
  label text not null,
  description text not null default '',
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Keys for outside services, set from Admin → APIs. Secrets are AES-256-GCM
-- ciphertext (key in SETTINGS_ENCRYPTION_KEY) and never leave the server.
create table public.integration_settings (
  id text primary key,
  enabled boolean not null default false,
  mode text check (mode in ('sandbox', 'live')),
  public_values jsonb not null default '{}',
  secret_values jsonb not null default '{}',
  last_check jsonb,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- RLS: on everywhere, no policies → API (service role) only
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Functions the API calls
-- ---------------------------------------------------------------------------

create or replace function public.distance_km(lat1 double precision, lng1 double precision,
                                              lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select case when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null else
    6371 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    )) end
$$;

-- The feed with every filter from apps/web/src/features/data/filtering.ts, in SQL.
-- Moderated posts never appear; p_owner lists one person's posts (My posts / profile).
create or replace function public.feed(
  p_viewer uuid default null,
  p_kind text default 'all',
  p_category text default 'all',
  p_scope text default 'country',
  p_q text default null,
  p_level text default 'all',
  p_conditions text[] default null,
  p_delivery text default 'any',
  p_within_hours integer default null,
  p_verified_only boolean default false,
  p_photo_only boolean default false,
  p_urgent_only boolean default false,
  p_show_given boolean default false,
  p_sort text default 'near',
  p_owner uuid default null,
  p_ids uuid[] default null,
  p_limit integer default 60,
  p_offset integer default 0
)
returns table (
  id uuid, kind text, title text, description text, category_id text, condition text,
  area text, district text, distance_km double precision, images text[],
  created_at timestamptz, request_count integer, edu_level text, edu_detail text,
  delivery text[], urgency text, qty integer, status text, owner_id uuid,
  author_name text, author_username text, author_verified boolean, author_trust integer
)
language sql stable as $$
  with me as (
    select area_lat, area_lng, district from public.profiles where id = p_viewer
  )
  select p.id, p.kind, p.title, p.description, p.category_id, p.condition,
         p.area, p.district,
         public.distance_km((select area_lat from me), (select area_lng from me), p.area_lat, p.area_lng),
         p.images, p.created_at, p.request_count, p.edu_level, p.edu_detail,
         p.delivery, p.urgency, p.qty, p.status, p.owner_id,
         a.display_name, a.username, a.is_verified, a.trust_score
  from public.posts p
  join public.profiles a on a.id = p.owner_id
  where p.status in ('available', 'reserved', 'given')
    and a.status = 'active'
    and (p_owner is null or p.owner_id = p_owner)
    and (p_ids is null or p.id = any (p_ids))
    and (p_kind = 'all' or p.kind = p_kind)
    and (p_category = 'all' or p.category_id = p_category)
    and (p_q is null or p_q = '' or
         (p.title || ' ' || p.description || ' ' || coalesce(p.edu_detail, '')) ilike '%' || p_q || '%')
    and (p_scope = 'country' or (select count(*) from me) = 0 or
         (p_scope = 'district' and p.district = (select district from me)) or
         (p_scope = 'area' and coalesce(
            public.distance_km((select area_lat from me), (select area_lng from me), p.area_lat, p.area_lng) <= 5,
            p.district = (select district from me))))
    and (p_level = 'all' or p.edu_level = p_level)
    and (p_conditions is null or cardinality(p_conditions) = 0 or p.condition = any (p_conditions))
    and (p_delivery = 'any' or p_delivery = any (p.delivery))
    and (p_within_hours is null or p.created_at > now() - make_interval(hours => p_within_hours))
    and (not p_verified_only or a.is_verified)
    and (not p_photo_only or cardinality(p.images) > 0)
    and (not p_urgent_only or p.urgency = 'urgent')
    and (p_show_given or p.status <> 'given')
  order by
    (p.status <> 'available'),
    case when p_sort = 'urgent' then
      case p.urgency when 'urgent' then 0 when 'soon' then 1 else 2 end end,
    case when p_sort = 'popular' then -p.request_count end,
    case when p_sort in ('near', 'urgent') then
      coalesce(public.distance_km((select area_lat from me), (select area_lng from me), p.area_lat, p.area_lng),
               case when p.district = (select district from me) then 50 else 500 end) end,
    p.created_at desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
$$;

create or replace function public.bump_view(p_post uuid)
returns void language sql as $$
  update public.posts set view_count = view_count + 1 where id = p_post
$$;

-- One impression/click per ad per browser session; the counter only moves on a new one.
create or replace function public.track_ad(p_ad uuid, p_type text, p_session text)
returns void language plpgsql as $$
begin
  insert into public.ad_events (ad_id, type, session_id) values (p_ad, p_type, p_session)
  on conflict do nothing;
  if found then
    update public.ad_campaigns
       set impressions = impressions + (p_type = 'impression')::int,
           clicks = clicks + (p_type = 'click')::int
     where id = p_ad;
  end if;
end $$;

-- Per-district donation totals for the Home map. Never an address; names only for
-- people who opted in, and only once a district has 3+ donors.
create or replace function public.donation_map()
returns jsonb language sql stable as $$
  with given as (
    select e.id, e.completed_at, p.title, p.district, g.id as giver_id,
           split_part(g.display_name, ' ', 1) as first_name, g.show_on_map
    from public.exchanges e
    join public.posts p on p.id = e.post_id
    join public.profiles g on g.id = e.giver_id
    where e.status = 'completed'
  ),
  hubs as (
    select district,
           count(distinct giver_id) as donors,
           count(*) filter (where completed_at > date_trunc('month', now())) as items,
           bool_or(completed_at > now() - interval '24 hours') as fresh
    from given group by district
  )
  select jsonb_build_object(
    'hubs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'district', h.district, 'donors', h.donors, 'items', h.items, 'fresh', h.fresh,
        'recent', case when h.donors < 3 then '[]'::jsonb else coalesce((
          select jsonb_agg(jsonb_build_object('name', r.first_name, 'item', r.title, 'at', r.completed_at))
          from (select * from given g2 where g2.district = h.district and g2.show_on_map
                order by g2.completed_at desc limit 3) r), '[]'::jsonb) end
      ) order by h.donors desc)
      from hubs h), '[]'::jsonb),
    'givenToday', (select count(*) from given where completed_at > date_trunc('day', now())),
    'givenThisMonth', (select count(*) from given where completed_at > date_trunc('month', now())),
    'districtsActive', (select count(*) from hubs where items > 0)
  )
$$;

-- Impact numbers for a profile (apps/web/src/features/feed/gamify.ts ImpactStats).
-- kg saved is estimated on the client from givenByCategory.
create or replace function public.profile_stats(p_user uuid)
returns jsonb language sql stable as $$
  with done as (
    select e.*, p.category_id, r.district as receiver_district
    from public.exchanges e
    join public.posts p on p.id = e.post_id
    join public.profiles r on r.id = e.receiver_id
    where e.status = 'completed' and (e.giver_id = p_user or e.receiver_id = p_user)
  ),
  replies as (
    -- Minutes from a request arriving to this person's first message in that chat.
    select extract(epoch from (min(m.created_at) - e.created_at)) / 60 as mins
    from public.exchanges e
    join public.messages m on m.conversation_id = e.conversation_id and m.sender_id = p_user
    where e.requested_by <> p_user and (e.giver_id = p_user or e.receiver_id = p_user)
    group by e.id, e.created_at
  )
  select jsonb_build_object(
    'given', (select count(*) from done where giver_id = p_user),
    'received', (select count(*) from done where receiver_id = p_user),
    'booksGiven', (select count(*) from done where giver_id = p_user and category_id = 'books'),
    'thanksReceived', (select count(*) from public.thanks where to_id = p_user),
    'thanksWritten', (select count(*) from public.thanks where from_id = p_user),
    'localHelped', (select count(*) from done
                    where giver_id = p_user
                      and receiver_district = (select district from public.profiles where id = p_user)),
    'givenByCategory', coalesce((select jsonb_object_agg(category_id, n) from
                        (select category_id, count(*) as n from done where giver_id = p_user group by 1) c),
                        '{}'::jsonb),
    -- Needs a few data points before it means anything.
    'responseMins', (select case when count(*) >= 3
                       then round(percentile_cont(0.5) within group (order by mins))::int end
                     from replies)
  )
$$;

-- Trust score from what a person actually did. Called after exchanges, thanks and
-- report decisions; the formula lives here so web, admin and app agree.
create or replace function public.refresh_trust(p_user uuid)
returns integer language plpgsql as $$
declare score integer;
begin
  select least(100, greatest(0,
           50
           + 10 * (case when pr.is_verified then 1 else 0 end)
           + 5 * least(6, (select count(*) from public.exchanges e
                           where e.giver_id = p_user and e.status = 'completed'))
           + 2 * least(5, (select count(*) from public.exchanges e
                           where e.receiver_id = p_user and e.status = 'completed'))
           + 2 * least(5, (select count(*) from public.thanks t where t.to_id = p_user))
           - 15 * (select count(*) from public.reports r
                   where r.status = 'resolved' and (
                     (r.target_type = 'user' and r.target_id = p_user) or
                     (r.target_type = 'post' and r.target_id in
                        (select id from public.posts where owner_id = p_user))))
         ))
    into score
  from public.profiles pr where pr.id = p_user;
  update public.profiles set trust_score = score where id = p_user and trust_score is distinct from score;
  return score;
end $$;

-- Sending a message: insert, bump the conversation, count unread for the others.
create or replace function public.send_message(p_conversation uuid, p_sender uuid, p_text text,
                                               p_type text default 'text', p_metadata jsonb default null)
returns public.messages language plpgsql as $$
declare m public.messages;
begin
  insert into public.messages (conversation_id, sender_id, type, content, metadata)
  values (p_conversation, p_sender, p_type, p_text, p_metadata)
  returning * into m;
  update public.conversations set last_message_at = m.created_at where id = p_conversation;
  -- System lines ("request sent") don't count as unread; the request has its own notification.
  update public.conversation_participants
     set unread_count = unread_count + 1, archived = false
   where conversation_id = p_conversation and p_sender is not null and user_id <> p_sender;
  return m;
end $$;

-- "I want this" / "I have this": exchange + conversation + system message, atomically.
create or replace function public.request_post(p_post uuid, p_requester uuid, p_message text, p_via text)
returns public.exchanges language plpgsql as $$
declare
  p public.posts;
  e public.exchanges;
  c uuid;
begin
  select * into p from public.posts where id = p_post for update;
  if p.id is null or p.status not in ('available', 'reserved') then
    raise exception 'post_not_available' using errcode = 'P0002';
  end if;
  if p.owner_id = p_requester then
    raise exception 'own_post' using errcode = 'P0001';
  end if;
  if not (p_via = any (p.delivery)) then
    raise exception 'delivery_not_offered' using errcode = 'P0001';
  end if;

  insert into public.conversations (post_id) values (p_post) returning id into c;
  insert into public.conversation_participants (conversation_id, user_id)
  values (c, p.owner_id), (c, p_requester);

  insert into public.exchanges (post_id, giver_id, receiver_id, requested_by, via, message, conversation_id)
  values (p_post,
          case when p.kind = 'offer' then p.owner_id else p_requester end,
          case when p.kind = 'offer' then p_requester else p.owner_id end,
          p_requester, p_via, coalesce(p_message, ''), c)
  returning * into e;

  update public.posts set request_count = request_count + 1 where id = p_post;
  perform public.send_message(c, null, 'request_sent', 'system');
  if coalesce(trim(p_message), '') <> '' then
    perform public.send_message(c, p_requester, p_message);
  end if;
  return e;
end $$;

-- Admin dashboard numbers. Deltas are % change: users/posts week over week,
-- completed exchanges month over month.
create or replace function public.admin_stats()
returns jsonb language sql stable as $$
  with pct as (
    select (a - b) * 100 / greatest(b, 1) as v, k from (
      select 'users' as k,
             (select count(*) from public.profiles where created_at > now() - interval '7 days') as a,
             (select count(*) from public.profiles where created_at between now() - interval '14 days' and now() - interval '7 days') as b
      union all
      select 'posts',
             (select count(*) from public.posts where created_at > now() - interval '7 days'),
             (select count(*) from public.posts where created_at between now() - interval '14 days' and now() - interval '7 days')
      union all
      select 'exchanges',
             (select count(*) from public.exchanges where status = 'completed' and completed_at > date_trunc('month', now())),
             (select count(*) from public.exchanges where status = 'completed'
                and completed_at between date_trunc('month', now()) - interval '1 month' and date_trunc('month', now()))
    ) t
  ),
  days as (select generate_series(current_date - 13, current_date, interval '1 day')::date as d)
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'usersDelta', (select v from pct where k = 'users'),
    'activePosts', (select count(*) from public.posts where status in ('available', 'reserved')),
    'postsDelta', (select v from pct where k = 'posts'),
    'exchangesMonth', (select count(*) from public.exchanges where status = 'completed' and completed_at > date_trunc('month', now())),
    'exchangesDelta', (select v from pct where k = 'exchanges'),
    'pendingCourier', (select count(*) from public.courier_requests where status = 'pending'),
    'openReports', (select count(*) from public.reports where status in ('open', 'investigating')),
    'pendingVerifications', (select count(*) from public.verifications where status = 'pending'),
    'pendingPayments', (select count(*) from public.payments where status = 'pending'),
    'openRisk', (select count(*) from public.risk_cases where status in ('open', 'held')),
    'series', (select jsonb_agg(jsonb_build_object(
        'day', to_char(d, 'YYYY-MM-DD'),
        'posts', (select count(*) from public.posts where created_at::date = d),
        'exchanges', (select count(*) from public.exchanges where status = 'completed' and completed_at::date = d),
        'signups', (select count(*) from public.profiles where created_at::date = d)) order by d) from days),
    'byCategory', coalesce((select jsonb_agg(jsonb_build_object('category', category_id, 'count', n) order by n desc)
        from (select category_id, count(*) n from public.posts where status in ('available', 'reserved', 'given') group by 1) c), '[]'),
    'topDistricts', coalesce((select jsonb_agg(jsonb_build_object('district', district, 'count', n) order by n desc)
        from (select district, count(*) n from public.posts where status in ('available', 'reserved', 'given')
              group by 1 order by 2 desc limit 8) t), '[]'),
    'ads', jsonb_build_object(
        'impressions', (select coalesce(sum(impressions), 0) from public.ad_campaigns),
        'clicks', (select coalesce(sum(clicks), 0) from public.ad_campaigns),
        -- Direct ads are sold outside the app; AdX revenue needs the Ad Manager reporting API.
        'estRevenue', 0)
  )
$$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
       ('chat-attachments', 'chat-attachments', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
       ('ad-images', 'ad-images', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Defaults (same values the UI mock shows)
-- ---------------------------------------------------------------------------

insert into public.categories (id, name_bn, name_en, emoji, sort) values
  ('books', 'বই', 'Books', '📚', 10),
  ('stationery', 'খাতা-কলম', 'Stationery', '📓', 20),
  ('furniture', 'আসবাব', 'Furniture', '🪑', 30),
  ('clothes', 'কাপড়', 'Clothes', '👕', 40),
  ('electronics', 'ইলেকট্রনিক্স', 'Electronics', '🔌', 50),
  ('kids', 'শিশুদের', 'Kids', '🧸', 60),
  ('other', 'অন্যান্য', 'Other', '🎁', 100)
on conflict (id) do nothing;

insert into public.cms_pages (slug, title, body, status) values
  ('terms', 'শর্তাবলী', '', 'draft'),
  ('privacy', 'প্রাইভেসি নীতি', '', 'draft'),
  ('about', 'আমাদের কথা', '', 'draft'),
  ('help', 'সাহায্য (FAQ)', '', 'draft')
on conflict (slug) do nothing;

insert into public.feature_flags (key, label, description, enabled) values
  ('ads_enabled', 'বিজ্ঞাপন', 'ফিডে Google বিজ্ঞাপন দেখান', false),
  ('ai_draft', 'AI দিয়ে পোস্ট খসড়া', 'ছবি থেকে শিরোনাম ও বিবরণ তৈরি (Gemini)', true),
  ('courier', 'কুরিয়ার ডেলিভারি', 'Steadfast কুরিয়ার অনুরোধ', true),
  ('need_posts', '‘আমার দরকার’ পোস্ট', 'চাওয়ার পোস্ট চালু', true),
  ('new_signups', 'নতুন সাইন-আপ', 'বন্ধ করলে নতুন অ্যাকাউন্ট খোলা যাবে না', true),
  ('chat_images', 'চ্যাটে ছবি', 'মেসেজে ছবি পাঠানো', false)
on conflict (key) do nothing;

insert into public.platform_settings (key, value) values
  ('general', '{"supportEmail": "support@reusedo.app", "aiDailyLimit": 15, "maxPhotos": 5,
                "requestExpiryDays": 7, "maintenanceMode": false}'),
  ('ad_network', '{"adsEnabled": false, "adxEnabled": false, "networkCode": "",
                   "units": {"feed": "/reusedo/feed_native", "sidebar": "/reusedo/sidebar", "post_detail": "/reusedo/post"},
                   "every": 6, "sessionCap": 8, "newUserLight": true, "priority": "direct_first"}'),
  ('payments', '{"methods": {"cod": true, "bkash": false, "nagad": false}, "bkashNumber": "", "nagadNumber": "",
                 "charges": {"insideDhaka": 70, "dhakaSuburb": 100, "outsideDhaka": 120, "perExtraKg": 20},
                 "baseWeightKg": 1, "advanceFrom": "high"}')
on conflict (key) do nothing;
