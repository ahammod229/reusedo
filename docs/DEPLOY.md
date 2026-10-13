# ReuseDo — আর্কিটেকচার ও ডেপ্লয় (সার্ভার ছাড়া)

## কোথায় কী থাকবে

```
ব্রাউজার (React) / অ্যাপ (Flutter)
   │
   ├─► Firebase Hosting ── ওয়েবসাইট (apps/web/dist)            reuse-do.web.app → www.reusedo.com
   ├─► Firebase Auth ───── সাইন-আপ, লগইন, Google, পাসওয়ার্ড রিসেট
   │        │  Firebase ID টোকেন
   │        ▼
   └─► Supabase ────────── ইউজারের সব ডেটা + ছবি + রিয়েলটাইম চ্যাট
            ├─ Postgres: টেবিল + RLS + নিরাপদ ফাংশন (supabase/migrations)
            ├─ Storage: post-images
            ├─ Realtime: মেসেজ, নোটিফিকেশন
            └─ Edge Functions (supabase/functions): email-code · ai-draft · admin-courier
```

**কোনো API সার্ভার নেই** (Render/Express বাদ)। ব্রাউজার সরাসরি Supabase-এর সাথে কথা বলে, Firebase লগইনের টোকেন দিয়ে।
সিকিউরিটি এখন ডাটাবেসেই: প্রতিটি টেবিলে RLS, আর যেসব কাজে একাধিক সারি বদলায় (রিকোয়েস্ট, হস্তান্তর কোড, কুরিয়ার, রিপোর্ট) সেগুলো `SECURITY DEFINER` ফাংশন যা কে কল করছে তা যাচাই করে।
যা গোপন কী চায় (ইমেইল কোড, Gemini, Steadfast) তা Edge Function-এ — কী কখনো ব্রাউজারে যায় না।

### মাসিক খরচ (শুরুতে)

| অংশ | খরচ |
|---|---|
| Firebase Hosting + Auth | বিনামূল্যে সীমার মধ্যে |
| Supabase | বিনামূল্যে প্ল্যান; ⚠️ ৭ দিন কেউ না ঢুকলে প্রজেক্ট ঘুমায় — লঞ্চের পর Pro ($25) নিন |
| Edge Functions | Supabase প্ল্যানের মধ্যে |
| Resend (ইমেইল কোড) | বিনামূল্যে ৩,০০০/মাস (দিনে ১০০) |
| Gemini AI | বিনামূল্যে টিয়ার (সীমা আছে) |
| ডোমেইন | বছরে ডোমেইন-ফি |

Render আর লাগছে না।

## নিরাপত্তার নিয়ম (ডাটাবেসে বসানো, ৭০+ টেস্টে যাচাই)

- নিজের প্রোফাইল ছাড়া অন্যের প্রোফাইল পড়া/বদলানো যায় না; পাবলিক তথ্য `public_profiles` ভিউতে (ইমেইল, ফোন, রোল নেই)।
- `role`, ইমেইল, ট্রাস্ট কলাম ইউজার বদলাতে পারে না (কলাম-লেভেল অনুমতি)।
- পোস্ট করতে ইমেইল-কোড যাচাই + ঠিকানা লাগে; দিনে সর্বোচ্চ ২০টি; অন্যের নামে পোস্ট হয় না; `hidden`/`given` ইউজার সেট করতে পারে না।
- একটি এক্সচেঞ্জ শুধু দাতা-গ্রহীতা ও অ্যাডমিন দেখে; চ্যাট শুধু সদস্যরা।
- হস্তান্তর কোড: ৪ অঙ্ক, শুধু দাতা দেখে, গ্রহীতা ৫ বার চেষ্টা করতে পারে, তারপর লক।
- কুরিয়ার: দুজন রাজি না হলে অ্যাডমিন কিউতে যায় না; কনফার্ম শুধু অ্যাডমিন (Edge Function)।
- ছবি আপলোড শুধু নিজের ফোল্ডারে (`<firebase-uid>/…`), সর্বোচ্চ ১ MB, শুধু jpeg/png/webp।
- দানের ম্যাপে শুধু জেলা; নাম দেখায় শুধু যারা অনুমতি দিয়েছেন এবং জেলায় ৩+ দাতা থাকলে।

## ১. Supabase (একবার)

> ⚠️ **প্রজেক্ট মিলিয়ে নিন।** `.env.production`-এ Supabase URL এখনও পুরনো প্রজেক্টের (`hbqdyk…`), কিন্তু `.mcp.json` ও `supabase/config.toml` নতুন প্রজেক্টে (`ptufbl…`) যায়। যেটা ব্যবহার করবেন সেটার URL ও **anon key** `.env.production`-এ বসান।

1. **Authentication → Sign In / Providers → Third-party Auth → Add provider → Firebase**, Project ID: `reuse-do`।
2. **SQL Editor**-এ `supabase/migrations/20261014000000_serverless_core.sql` পুরোটা চালান (বা `supabase db push`)। এটি **নতুন/খালি** প্রজেক্টের জন্য; পুরনো Express-এর টেবিল থাকলে ইচ্ছা করেই ব্যর্থ হয়।
3. **Storage**-এ `post-images` বাকেট মাইগ্রেশনেই তৈরি হয় — আছে কিনা দেখুন।
4. **Database → Replication**-এ `messages` ও `notifications` Realtime-এ আছে কিনা দেখুন (মাইগ্রেশন যোগ করে)।
5. **Edge Functions** ডেপ্লয়:
   ```bash
   npx supabase login
   npx supabase link --project-ref <আপনার-ref>
   npx supabase functions deploy email-code ai-draft admin-courier
   ```

## ২. Firebase (একবার)

1. Authentication → Sign-in method: **Email/Password** ও **Google** চালু।
2. Authentication → Settings → **Authorized domains**: `www.reusedo.com`, `reusedo.com`।
3. **Email enumeration protection** চালু রাখুন।
4. Project settings → Service accounts → **Generate new private key** (JSON) — নিচের `FIREBASE_SERVICE_ACCOUNT`-এর জন্য। ফাইলটি কোথাও কমিট করবেন না।

## ৩. Edge Function সিক্রেট

```bash
npx supabase secrets set \
  FIREBASE_PROJECT_ID=reuse-do \
  FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
  ALLOWED_ORIGINS="https://www.reusedo.com,https://reusedo.com,https://reuse-do.web.app" \
  RESEND_API_KEY=... EMAIL_FROM="ReuseDo <no-reply@reusedo.com>" EMAIL_CODE_PEPPER=<লম্বা-র‍্যান্ডম> \
  GEMINI_API_KEY=... \
  STEADFAST_API_KEY=... STEADFAST_SECRET_KEY=...
```

- Resend-এ নিজের ডোমেইন যাচাই করুন (SPF/DKIM), নইলে কোড স্প্যামে যাবে।
- `STEADFAST_*` না দিলে অ্যাডমিন কুরিয়ার কনফার্মে হাতে বুক করা ট্র্যাকিং কোড দিতে হবে।
- Gemini ফ্রি টিয়ারে গুগল প্রম্পট/ছবি মডেল উন্নয়নে ব্যবহার করতে পারে — প্রাইভেসি পলিসিতে লিখুন।

## ৪. প্রথম অ্যাডমিন

সাইন-আপ করে অনবোর্ডিং শেষ করুন, তারপর Supabase SQL Editor-এ:

```sql
update public.profiles set role = 'admin' where email = 'আপনার@ইমেইল';
```

## ৫. ওয়েবসাইট → Firebase Hosting

```bash
pnpm install
pnpm --filter web build        # .env.production থেকে VITE_* নেয়
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

কাস্টম ডোমেইন: Firebase Console → Hosting → Add custom domain।

## ৬. চালুর পর পরীক্ষা

- [ ] নতুন অ্যাকাউন্ট → ইমেইলে ৬-সংখ্যার কোড → ঠিকানা → হোম খোলে
- [ ] পোস্ট করুন (ছবিসহ) → Supabase Table Editor-এ `posts`-এ সারি + Storage-এ ছবি
- [ ] দ্বিতীয় অ্যাকাউন্ট থেকে রিকোয়েস্ট → প্রথম অ্যাকাউন্টে নোটিফিকেশন রিয়েলটাইমে আসে
- [ ] ব্রাউজারের Network ট্যাবে কোনো `onrender.com`/API কল নেই, শুধু `*.supabase.co` ও `*.googleapis.com`
- [ ] Supabase → Authentication → Policies-এ প্রতিটি টেবিলে RLS "enabled" দেখায়

## ⚠️ যা এখনও বাকি

- **অ্যাডমিন প্যানেল** (`/admin`) এখনও নমুনা ডেটায় চলে, শুধু **কুরিয়ার কিউ** আসল (Edge Function)। পোস্ট/রিপোর্ট/ইউজার মডারেশন স্ক্রিন Supabase-এ জোড়া বাকি (RLS-এ অ্যাডমিন অনুমতি আগে থেকেই আছে)।
- **Flutter অ্যাপের** `DataSource` এখনও নমুনা; একই টেবিল/ফাংশন দিয়ে `supabase_flutter` + Firebase টোকেনে জুড়তে হবে (`docs/FLUTTER_APP.md`)।
- **শেষ-থেকে-শেষ পরীক্ষা**: SQL (RLS) ও Edge Function-এর ইউনিট টেস্ট পাস, কিন্তু আসল Supabase + Firebase দিয়ে ব্রাউজারে পুরো ফ্লো আপনাকে একবার চালিয়ে দেখতে হবে (উপরের চেকলিস্ট)।
- দিনে ২০টি AI ড্রাফট ও ২০টি পোস্টের সীমা ধরা আছে; ব্যবহার বাড়লে বদলান।
