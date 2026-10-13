# ReuseDo — হোস্টিং ও ডেপ্লয় গাইড

## কোথায় কী থাকবে

```
ব্রাউজার / অ্যাপ
   │
   ├─► Firebase Hosting ── ওয়েবসাইট (React, apps/web/dist)           reusedo-we.web.app → www.reusedo.com
   ├─► Firebase Auth ───── লগইন, পাসওয়ার্ড, Google সাইন-ইন
   │
   └─► API (Render) ────── Express + Socket.io, https://reusedo.onrender.com
            │
            └─► Supabase ─ ইউজারের ডেটা (প্রোফাইল, পোস্ট, চ্যাট, এক্সচেঞ্জ…) + ছবি স্টোরেজ
```

- **Firebase:** ওয়েবসাইট হোস্ট (Hosting) + লগইন (Auth) + পরে পুশ নোটিফিকেশন (FCM)।
- **Supabase:** ইউজারের সব ডেটা (Postgres)। সার্ভিস-রোল কী শুধু API সার্ভারে — ব্রাউজারে কখনো নয়।
- **Render:** API। কেন আলাদা? Firebase Hosting শুধু স্ট্যাটিক ফাইল দেয়; চ্যাট (Socket.io), ইমেইল কোড ও কুরিয়ারের জন্য চলমান সার্ভার লাগে।

> Firebase প্রজেক্ট আইডি: **reusedo-we** (`.env.production`-এর সাথে মিলিয়ে ঠিক করা হয়েছে; আগে `.firebaserc`-এ পুরনো `binimoy-we` ছিল, ফলে ডেপ্লয় ভুল প্রজেক্টে যেত)।

## ১. Supabase (একবার)

1. Supabase → SQL Editor-এ `apps/api/src/database/migrations/` এর ফাইলগুলো ক্রমানুসারে চালান (`M01` … `M16`)। ডাটাবেস যদি আগে রুটের `full_migration.sql` দিয়ে বানানো হয়ে থাকে, তবে অন্তত `M16_email_verification.sql` চালান এবং বাকি টেবিলগুলো আছে কিনা দেখুন।
2. **Table Editor → প্রতিটি টেবিলে RLS চালু** আছে কিনা দেখুন। API সার্ভিস-রোল দিয়ে চলে (RLS পেরিয়ে), কিন্তু ব্রাউজারে anon key আছে — RLS বন্ধ থাকলে যে কেউ ডেটা পড়তে পারবে।
3. Storage-এ ছবির বাকেট (`apps/api/src/database/migrations/M15_product_storage.sql`) আছে কিনা দেখুন।
4. Settings → API থেকে `Project URL` ও `service_role` কী নিন (Render-এ দেবেন)।

## ২. Firebase (একবার)

1. Authentication → Sign-in method: **Email/Password** ও **Google** চালু।
2. Authentication → Settings → **Authorized domains**: `www.reusedo.com`, `reusedo.com` যোগ করুন (`reusedo-we.web.app` আগে থেকেই থাকে)।
3. Authentication → Settings → **Email enumeration protection** চালু রাখুন।
4. Project settings → Service accounts → **Generate new private key** → JSON থেকে `project_id`, `client_email`, `private_key` নিন (Render-এ দেবেন; ফাইলটি কোথাও কমিট করবেন না)।

## ৩. API → Render

1. Render → New → Blueprint → এই রিপোজিটরি। `render.yaml` সব ঠিক করে দেবে (সার্ভিসের নাম `reusedo` → `https://reusedo.onrender.com`)।
2. Environment-এ এগুলো দিন:

| Key | Value |
|---|---|
| `CLIENT_URL` | `https://www.reusedo.com,https://reusedo.com,https://reusedo-we.web.app` (কমা দিয়ে একাধিক) |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role কী |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | সার্ভিস অ্যাকাউন্ট JSON থেকে (`private_key`-এর নতুন লাইন `\n` হিসেবে থাকবে) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend (ইমেইল কোড)। Resend-এ ডোমেইন যাচাই করুন (SPF/DKIM) |
| `EMAIL_CODE_PEPPER` | যেকোনো লম্বা র‍্যান্ডম স্ট্রিং |

3. ডেপ্লয় শেষে `https://reusedo.onrender.com/health` খুললে `{"status":"ok"}` আসবে।
4. ⚠️ ফ্রি প্ল্যান ১৫ মিনিট অব্যবহৃত থাকলে ঘুমিয়ে যায় — প্রথম রিকোয়েস্ট ধীর হবে এবং চ্যাট সংযোগ কাটবে। চালুর পর **Starter** প্ল্যান নিন।

## ৪. ওয়েবসাইট → Firebase Hosting

```bash
pnpm install
pnpm --filter web build          # .env.production থেকে VITE_* মান নেয়, আউটপুট apps/web/dist
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

`firebase.json`-এ ইতিমধ্যে আছে: সব রুট `index.html`-এ (SPA), CSP/HSTS/ফ্রেম সুরক্ষা হেডার, `/assets` লম্বা ক্যাশ, `sw.js` নো-ক্যাশ।

### নিজের ডোমেইন (www.reusedo.com)

Firebase Console → Hosting → **Add custom domain** → দেওয়া DNS রেকর্ডগুলো ডোমেইন রেজিস্ট্রারে বসান। SSL নিজে থেকে হয়ে যায় (কয়েক ঘণ্টা লাগতে পারে)।

## ৫. চালুর পর পরীক্ষা

- [ ] নতুন অ্যাকাউন্ট খুলুন → ইমেইলে ৬-সংখ্যার কোড আসে → ঠিকানা দিন → হোম খোলে
- [ ] ব্রাউজারের Network ট্যাবে API কল `reusedo.onrender.com`-এ যাচ্ছে এবং CORS ত্রুটি নেই
- [ ] অ্যাডমিন: Supabase `profiles` টেবিলে আপনার সারিতে `role = 'ADMIN'` করুন → `/admin` খোলে
- [ ] Supabase ড্যাশবোর্ডে `profiles`-এ নতুন সারি দেখা যায়

## ⚠️ জানা বাকি কাজ

ওয়েবের ফিড, চ্যাট, এক্সচেঞ্জ ইত্যাদি এখনও **নকল ডেটায়** চলে (`VITE_USE_MOCK` ডিফল্ট true)। আসল API জোড়া হয়ে `VITE_USE_MOCK=false` না দেওয়া পর্যন্ত লাইভ সাইটে নমুনা পোস্ট দেখাবে এবং Supabase-এ পোস্ট জমা হবে না। সাইন-আপ/লগইন/ইমেইল কোড আসল (Firebase + API + Supabase)। বিস্তারিত: `docs/BUILD_GUIDE.md` §২।
