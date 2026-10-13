-- Row-level-security tests. Run on Postgres 15+ after 00_local_stubs.sql and the migration:
--   psql -v ON_ERROR_STOP=1 -d reusedo_test -f tests/rls.test.sql
-- Each "user" is simulated by the claims a Firebase ID token would carry (sub, email, email_verified, name).

create schema test;
grant usage on schema test to anon, authenticated;

-- Runs sql as the current role and fails the test unless it errors with the expected text.
create function test.must_fail(q text, expect text default '') returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if expect <> '' and position(expect in sqlerrm) = 0 then
      raise exception 'wrong error for [%]: wanted "%", got "%"', q, expect, sqlerrm;
    end if;
    return;
  end;
  raise exception 'expected failure but it succeeded: %', q;
end $$;
grant execute on function test.must_fail(text, text) to anon, authenticated;

-- psql variables are not expanded inside $$ bodies, so checks that need them use this instead of DO + assert.
create function test.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAILED: %', msg; end if; end $$;
grant execute on function test.ok(boolean, text) to anon, authenticated;

\set as_unverified 'reset role; set role authenticated; select set_config(''request.jwt.claims'', ''{"sub":"uidU","email":"u@x.com","email_verified":false}'', false);'
\set as_a 'reset role; set role authenticated; select set_config(''request.jwt.claims'', ''{"sub":"uidA","email":"alice@x.com","email_verified":true,"name":"Alice Giver"}'', false);'
\set as_b 'reset role; set role authenticated; select set_config(''request.jwt.claims'', ''{"sub":"uidB","email":"bob@x.com","email_verified":true,"name":"Bob Receiver"}'', false);'
\set as_c 'reset role; set role authenticated; select set_config(''request.jwt.claims'', ''{"sub":"uidC","email":"carol@x.com","email_verified":true,"name":"Carol Outsider"}'', false);'
\set as_d 'reset role; set role authenticated; select set_config(''request.jwt.claims'', ''{"sub":"uidD","email":"dina@x.com","email_verified":true,"name":"Dina Admin"}'', false);'
\set as_anon 'reset role; set role anon; select set_config(''request.jwt.claims'', '''', false);'

-- ── 1. sign-up gate ──
:as_unverified
select test.must_fail($$select public.ensure_profile()$$, 'email_not_verified');
:as_anon
select test.must_fail($$select public.ensure_profile()$$, 'not_signed_in');

-- ── 2. profiles ──
:as_a
select id from public.ensure_profile() \gset a_
do $$ begin assert (select count(*) from public.ensure_profile()) = 1; end $$;   -- idempotent
select test.must_fail($$update public.profiles set role = 'admin'$$, 'permission denied');
select test.must_fail($$update public.profiles set email = 'x@y.z'$$, 'permission denied');
select test.must_fail($$update public.profiles set firebase_uid = 'uidB'$$, 'permission denied');
update public.profiles set phone_number = '01711111111', division = 'ঢাকা', district = 'ঢাকা', upazila = 'মিরপুর', area = 'মিরপুর ১০', show_on_map = true;
select test.must_fail($$update public.profiles set phone_number = '123'$$, 'check constraint');

:as_b
select id from public.ensure_profile() \gset b_
update public.profiles set phone_number = '01822222222', district = 'ঢাকা', upazila = 'মিরপুর', area = 'মিরপুর ১১';
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'a user must only see their own profile row';
  assert (select count(*) from public.public_profiles) = 2, 'public_profiles lists everyone';
  assert (select verified from public.public_profiles where username = 'alice'), 'onboarded person is verified';
end $$;
select test.must_fail($$select phone_number from public.public_profiles$$, 'does not exist');

:as_c
select id from public.ensure_profile() \gset c_
update public.profiles set phone_number = '01933333333', district = 'চট্টগ্রাম', upazila = 'পাঁচলাইশ', area = 'পাঁচলাইশ';

:as_d
select id from public.ensure_profile() \gset d_
update public.profiles set phone_number = '01644444444', district = 'ঢাকা', upazila = 'উত্তরা', area = 'উত্তরা';

:as_anon
select test.must_fail($$select * from public.profiles$$, 'permission denied');
select test.must_fail($$select * from public.exchanges$$, 'permission denied');
select test.must_fail($$select * from public.messages$$, 'permission denied');

-- ── 3. posts ──
:as_a
insert into public.posts (owner_id, kind, title, description, category, district, upazila, area, delivery)
values (public.my_pid(), 'offer', 'ক্লাস ৮-এর সব বই', 'ভালো অবস্থায়', 'books', 'ঢাকা', 'মিরপুর', 'মিরপুর ১০', '{pickup}');
insert into public.posts (owner_id, kind, title, category, district, upazila, delivery)
values (public.my_pid(), 'offer', 'দ্বিতীয় পোস্ট বই', 'books', 'ঢাকা', 'মিরপুর', '{pickup}');
insert into public.posts (owner_id, kind, title, category, district, upazila, delivery)
values (public.my_pid(), 'offer', 'কুরিয়ারে পাঠানো যাবে', 'stationery', 'ঢাকা', 'মিরপুর', '{pickup,courier}');
select test.must_fail(format($$insert into public.posts (owner_id, kind, title, category, district) values (%L, 'offer', 'অন্যের নামে পোস্ট', 'books', 'ঢাকা')$$, :'b_id'), 'row-level security');
select test.must_fail($$insert into public.posts (owner_id, kind, title, category, district, hidden) values (public.my_pid(), 'offer', 'লুকানো পোস্ট ঠিক', 'books', 'ঢাকা', true)$$, 'permission denied');
select test.must_fail($$insert into public.posts (owner_id, kind, title, category, district, status) values (public.my_pid(), 'offer', 'ইতিমধ্যে দেওয়া হয়ে গেছে', 'books', 'ঢাকা', 'given')$$, 'permission denied');
select test.must_fail($$insert into public.posts (owner_id, kind, title, category, district) values (public.my_pid(), 'offer', 'abc', 'books', 'ঢাকা')$$, 'check constraint');
select test.must_fail($$update public.posts set status = 'given'$$, 'permission denied');
select test.must_fail($$update public.posts set hidden = true$$, 'permission denied');
select test.must_fail($$update public.posts set owner_id = null$$, 'permission denied');
select id from public.posts where title = 'ক্লাস ৮-এর সব বই' \gset p1_
select id from public.posts where title = 'দ্বিতীয় পোস্ট বই' \gset p2_
select id from public.posts where title = 'কুরিয়ারে পাঠানো যাবে' \gset p3_

:as_b
insert into public.posts (owner_id, kind, title, category, district, urgency, delivery)
values (public.my_pid(), 'need', 'পড়ার টেবিল দরকার', 'furniture', 'ঢাকা', 'soon', '{pickup}');
select test.must_fail(format($$update public.posts set title = 'হ্যাক করা শিরোনাম' where id = %L$$, :'p1_id') || '; select 1/(case when (select count(*) from public.posts where title = ''হ্যাক করা শিরোনাম'') = 0 then 0 else 1 end)', '');
do $$ begin
  assert (select count(*) from public.posts where title = 'হ্যাক করা শিরোনাম') = 0, 'B must not edit A''s post';
  assert (select distance_km from public.feed_posts where title = 'ক্লাস ৮-এর সব বই') = 2, 'same upazila ≈ 2 km';
  assert (select author_name from public.feed_posts where title = 'ক্লাস ৮-এর সব বই') = 'Alice Giver';
end $$;
:as_c
do $$ begin assert (select distance_km from public.feed_posts where title = 'ক্লাস ৮-এর সব বই') > 100, 'other district is far'; end $$;
:as_anon
do $$ begin
  assert (select count(*) from public.feed_posts) = 4, 'guests can browse the feed';
  assert (select distance_km from public.feed_posts limit 1) = 100, 'guests get a neutral distance';
end $$;

-- ── 4. request → exchange → chat ──
:as_b
select public.request_post(:'p1_id', 'বইগুলো দরকার', 'pickup') as ex1 \gset
select test.must_fail(format($$select public.request_post(%L, 'আবার', 'pickup')$$, :'p1_id'), 'duplicate key');
select test.must_fail(format($$select public.request_post(%L, '', 'courier')$$, :'p1_id'), 'delivery_not_offered');
:as_a
select test.must_fail(format($$select public.request_post(%L, '', 'pickup')$$, :'p1_id'), 'own_post');
do $$ begin
  assert (select count(*) from public.exchanges) = 1, 'giver sees the exchange';
  assert (select status from public.exchanges) = 'requested';
  assert (select count(*) from public.my_chats) = 1, 'giver has a chat';
  assert (select unread from public.my_chats) = 1, 'the requester message is unread';
  assert (select count(*) from public.notifications where kind = 'request') = 1, 'giver was notified';
end $$;
select conversation_id from public.exchanges \gset cv_
:as_c
do $$ begin
  assert (select count(*) from public.exchanges) = 0, 'outsider sees no exchanges';
  assert (select count(*) from public.messages) = 0, 'outsider sees no messages';
  assert (select count(*) from public.conversations) = 0;
  assert (select count(*) from public.notifications) = 0;
end $$;
select test.must_fail(format($$insert into public.messages (conversation_id, sender_id, body) values (%L, public.my_pid(), 'ঢুকে পড়ছি')$$, :'cv_conversation_id'), 'row-level security');
:as_b
insert into public.messages (conversation_id, sender_id, body) values (:'cv_conversation_id', public.my_pid(), 'আপনি কোথায় থাকেন?');
select test.must_fail(format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'অন্যের নামে')$$, :'cv_conversation_id', :'a_id'), 'row-level security');
select test.must_fail(format($$insert into public.messages (conversation_id, sender_id, kind, body) values (%L, public.my_pid(), 'system', 'ভুয়া সিস্টেম মেসেজ')$$, :'cv_conversation_id'), 'permission denied');
select test.must_fail(format($$update public.messages set body = 'edited' where conversation_id = %L$$, :'cv_conversation_id'), 'permission denied');
:as_a
do $$ begin assert (select count(*) from public.notifications where kind = 'message') = 1, 'message notified the other side'; end $$;
select public.mark_conversation_read(:'cv_conversation_id');
do $$ begin assert (select unread from public.my_chats) = 0; end $$;

-- ── 5. accept + hand-over ──
:as_b
select test.must_fail(format($$select public.accept_exchange(%L)$$, :'ex1'), 'not_allowed');
:as_a
select public.accept_exchange(:'ex1');
do $$ begin assert (select status from public.posts where title = 'ক্লাস ৮-এর সব বই') = 'reserved'; end $$;
:as_b
select test.must_fail(format($$select public.get_handover_code(%L)$$, :'ex1'), 'not_allowed');
select public.confirm_handover(:'ex1', '1234') as r1 \gset
select test.ok(:'r1' = 'wrong', 'a code that was never opened counts as wrong');

:as_a
select public.get_handover_code(:'ex1') as code1 \gset
select test.ok(length(:'code1') = 4, 'four digits');
select test.ok(public.get_handover_code(:'ex1') = :'code1', 'the code is stable until used');
select test.must_fail(format($$select public.confirm_handover(%L, %L)$$, :'ex1', :'code1'), 'not_allowed');   -- giver cannot confirm
select test.must_fail($$select * from public.exchange_secrets$$, 'permission denied');
:as_b
-- five wrong tries lock it, and then even the right code is refused
select (select public.confirm_handover(:'ex1', '0000')) as w1 \gset
select (select public.confirm_handover(:'ex1', '0001')) as w2 \gset
select (select public.confirm_handover(:'ex1', '0002')) as w3 \gset
select (select public.confirm_handover(:'ex1', '0003')) as w4 \gset
select (select public.confirm_handover(:'ex1', '0004')) as w5 \gset
select (select public.confirm_handover(:'ex1', :'code1')) as w6 \gset
select test.ok(:'w1' = 'wrong' and :'w4' = 'wrong', 'wrong tries are reported');
select test.ok(:'w5' = 'locked', 'fifth wrong try locks');
select test.ok(:'w6' = 'locked', 'the right code no longer works once locked');
select test.ok((select status from public.exchanges where id = :'ex1') = 'accepted', 'still not completed');

-- second exchange: the happy path
:as_b
select public.request_post(:'p2_id', '', 'pickup') as ex2 \gset
:as_a
select public.accept_exchange(:'ex2');
select public.get_handover_code(:'ex2') as code2 \gset
:as_b
select public.confirm_handover(:'ex2', :'code2') as done \gset
select test.ok(:'done' = 'ok', 'right code completes');
select test.ok((select status from public.exchanges where id = :'ex2') = 'completed', 'exchange completed');
select test.ok((select status from public.posts where id = :'p2_id') = 'given', 'post marked given');
select test.must_fail(format($$select public.confirm_handover(%L, %L)$$, :'ex2', :'code2'), 'not_allowed');   -- cannot replay
select public.send_thanks(:'ex2', 'অনেক ধন্যবাদ!');
select public.send_thanks(:'ex2', 'আবার');
:as_a
select test.must_fail(format($$select public.send_thanks(%L, 'নিজেকে')$$, :'ex2'), 'not_allowed');
:as_anon
do $$ begin assert (select count(*) from public.thanks) = 1, 'one thank-you, public'; end $$;

-- ── 6. courier flow ──
:as_b
select public.request_post(:'p3_id', '', 'courier') as ex3 \gset
:as_a
select public.accept_exchange(:'ex3');
select public.agree_courier(:'ex3') as c1 \gset
select test.ok(:'c1' = 'waiting', 'first agreement waits');
select test.ok((select count(*) from public.courier_requests) = 0, 'one side is not enough');
:as_b
select public.agree_courier(:'ex3') as c2 \gset
select test.ok(:'c2' = 'sent', 'second agreement sends it');
select test.ok((select count(*) from public.courier_requests) = 1, 'receiver sees it');
select test.ok((select charge from public.courier_requests) = 80, 'same district rate');
select test.must_fail($$update public.courier_requests set status = 'confirmed'$$, 'permission denied');
select test.must_fail($$insert into public.courier_requests (exchange_id, item, giver_name, giver_address, receiver_name, receiver_address, charge) values (gen_random_uuid(), 'x', 'x', 'x', 'x', 'x', 1)$$, 'permission denied');
:as_c
do $$ begin assert (select count(*) from public.courier_requests) = 0, 'outsider cannot see courier requests'; end $$;
select test.must_fail(format($$select public.agree_courier(%L)$$, :'ex3'), 'not_allowed');

-- ── 7. reports + saved ──
:as_b
select public.report_post(:'p1_id', 'spam', 'বিজ্ঞাপন');
select public.report_post(:'p1_id', 'spam', 'আবার');  -- second one is ignored
do $$ begin assert (select count(*) from public.reports) = 1; end $$;
insert into public.saved_posts (profile_id, post_id) values (public.my_pid(), :'p1_id');
:as_a
do $$ begin assert (select count(*) from public.reports) = 0, 'giver cannot read who reported'; assert (select count(*) from public.saved_posts) = 0; end $$;
select test.must_fail(format($$insert into public.saved_posts (profile_id, post_id) values (%L, %L)$$, :'b_id', :'p1_id'), 'row-level security');

-- ── 8. donation map ──
:as_anon
do $$ declare m jsonb; begin
  m := public.donation_map();
  assert (m ->> 'districtsActive')::int = 1;
  assert (m -> 'hubs' -> 0 ->> 'district') = 'ঢাকা';
  assert (m -> 'hubs' -> 0 ->> 'donors')::int = 1;
  assert jsonb_array_length(m -> 'hubs' -> 0 -> 'recent') = 0, 'no names below 3 donors';
  assert (m ->> 'givenToday')::int = 1;
end $$;

-- ── 9. admin ──
reset role;
update public.profiles set role = 'admin' where firebase_uid = 'uidD';
:as_d
do $$ begin
  assert public.is_admin();
  assert (select count(*) from public.profiles) = 4, 'admin reads all profiles';
  assert (select count(*) from public.courier_requests) = 1;
  assert (select count(*) from public.reports) = 1;
end $$;
select public.admin_set_post_hidden(:'p1_id', true);
:as_b
select test.must_fail(format($$select public.admin_set_post_hidden(%L, false)$$, :'p1_id'), 'not_allowed');
-- settings: public to read, admin-only to write (RLS filters a normal user's update down to zero rows)
:as_d
insert into public.platform_settings (key, value) values ('ads', '{"every": 6}');
:as_b
do $$ declare n int; begin
  update public.platform_settings set value = '{"every": 1}';
  get diagnostics n = row_count;
  assert n = 0, 'a normal user cannot change settings';
  assert (select count(*) from public.platform_settings) = 1, 'but can read them';
end $$;
select test.must_fail($$insert into public.platform_settings (key, value) values ('x', '{}')$$, 'row-level security');
:as_anon
do $$ begin assert (select count(*) from public.posts where title = 'ক্লাস ৮-এর সব বই') = 0, 'hidden posts disappear'; end $$;
:as_a
do $$ begin assert (select count(*) from public.posts where title = 'ক্লাস ৮-এর সব বই') = 1, 'the owner still sees it'; end $$;

-- ── 10. storage + rate limit ──
:as_a
insert into storage.objects (bucket_id, name) values ('post-images', 'uidA/photo1.jpg');
select test.must_fail($$insert into storage.objects (bucket_id, name) values ('post-images', 'uidB/photo1.jpg')$$, 'row-level security');
select test.must_fail($$insert into storage.objects (bucket_id, name) values ('other', 'uidA/photo1.jpg')$$, 'row-level security');

do $$ begin
  for i in 1..17 loop
    insert into public.posts (owner_id, kind, title, category, district) values (public.my_pid(), 'offer', 'ভর্তি পোস্ট নম্বর ' || i, 'other', 'ঢাকা');
  end loop;
end $$;
select test.must_fail($$insert into public.posts (owner_id, kind, title, category, district) values (public.my_pid(), 'offer', 'একুশ নম্বর পোস্ট', 'other', 'ঢাকা')$$, 'rate_limited');

reset role;
\warn 'ALL RLS TESTS PASSED'
