# ReuseDo — বিল্ড গাইডলাইন (Web → Flutter App)

**সংস্করণ:** 1.0 · **তারিখ:** 2026-10-06 · সঙ্গে পড়ুন: [PRD.md](./PRD.md)

এই ডকুমেন্টের উদ্দেশ্য: ওয়েব UI-এর পর ব্যাকএন্ড জুড়ে ওয়েব চালু করা, তারপর **একই API** দিয়ে Android ও iOS অ্যাপ (Flutter) বানানো — কোনো কিছু আন্দাজে না করে।

---

## ০. এখনকার অবস্থা (এক নজরে)

| বিষয় | অবস্থা |
|---|---|
| ওয়েব UI (মোবাইল + ট্যাবলেট + ডেস্কটপ) | ✅ সম্পূর্ণ — ৩২টি রাউট × ৫টি স্ক্রিন-প্রস্থ পরীক্ষিত, ওভারফ্লো/ত্রুটি নেই |
| ডেটা | 🟡 নকল (mock) — `features/data` স্তরের পেছনে, সুইচ করলেই আসল API |
| প্রোডাকশন বিল্ড + PWA | ✅ `pnpm --filter web build` সফল; আইকন, ম্যানিফেস্ট, সার্ভিস ওয়ার্কার আছে |
| অ্যাডমিন প্যানেল | ✅ ১৫টি স্ক্রিন নতুন করে বানানো (আগে ১৫টির মধ্যে প্রায় সবই ফাঁকা/"Loading"/প্লেসহোল্ডার ছিল) — §৪.১ |
| ব্যাকএন্ড সংযোগ | ❌ বাকি (§৫) |
| Flutter অ্যাপ | ❌ ওয়েব ব্যাকএন্ডসহ চালু হওয়ার পর (§১০) |
| আইনি পেজ (শর্তাবলী/প্রাইভেসি) | 🟡 খসড়া — আইনজীবীর অনুমোদন বাকি (§৬.গ) |

---

## ১. আর্কিটেকচার

```
apps/
  web/   React 19 + Vite + TS + Tailwind v4 + TanStack Query + Zustand
  api/   Express + Zod + Socket.io  →  Supabase (Postgres) + Firebase Auth/FCM
  app/   (পরে) Flutter — একই api/ ব্যবহার করবে
docs/    PRD.md, BUILD_GUIDE.md
```

**মূল নিয়ম:** UI কখনো সরাসরি `fetch`/mock ডেটা ইম্পোর্ট করে না। সব ডেটা আসে `features/data/hooks.ts` থেকে।

### `apps/web/src` কাঠামো

| ফোল্ডার | কাজ |
|---|---|
| `pages/` | রাউটের স্ক্রিন। এক ফাইল = এক স্ক্রিন |
| `features/data/` | **ডেটা-স্তর** (§২) |
| `features/feed/` | ফিড/পোস্ট কম্পোনেন্ট, i18n, ক্যাটাগরি, ছবি কম্প্রেশন, সেভ স্টোর |
| `features/geo/` | বাংলাদেশের বিভাগ→৬৪ জেলা, ফোন যাচাই |
| `features/admin/` | অ্যাডমিন প্যানেল |
| `shared/components/ui/` | ডিজাইন সিস্টেমের মূল কম্পোনেন্ট (Button, Input, Dialog, Sheet, Header…) |
| `routes/` | গার্ড (`ProtectedRoute`, `AdminRoute`, `GuestRoute`) ও রিডাইরেক্ট |

---

## ২. ডেটা-স্তর — ব্যাকএন্ড জোড়ার একমাত্র জায়গা

```
Page ──► hooks.ts (TanStack Query) ──► source ──┬─► mockSource.ts   (এখন)
                                                └─► apiSource.ts    (আপনি লিখবেন)
```

- `types.ts` — `DataSource` ইন্টারফেস: UI-র যা যা লাগে (`listFeed`, `getPost`, `publishPost`, `aiDraft`, `listChats`, `sendMessage`, `listExchanges`, `advanceExchange`, `listNotifications`, `markNotificationRead`, `getUser`, `listCourierRequests`, `decideCourierRequest`)।
- `apiSource.ts` — প্রতিটি মেথডে TODO + কোন এন্ডপয়েন্ট লাগবে লেখা আছে। এখন `throw "API not connected"`।
- `source.ts` — `VITE_USE_MOCK=false` দিলে `apiSource` সক্রিয়।
- `QueryState.tsx` — লোডিং স্কেলেটন + ত্রুটি + "আবার চেষ্টা" সব স্ক্রিনে একরকম।

**সংযোগের নিয়ম:** একটি মেথড একবারে লিখুন → `VITE_USE_MOCK=false` → সেই স্ক্রিন ব্রাউজারে দেখুন → পরেরটি। TypeScript দেখিয়ে দেবে কোথায় ডেটার আকৃতি মিলছে না। **পেজ ফাইল বদলাতে হবে না**; আকৃতি না মিললে `apiSource.ts`-এর ভেতরে ম্যাপ করুন।

---

## ৩. কোডিং নিয়ম

### ভাষা (i18n) — বাংলা ডিফল্ট, ইংরেজি ঐচ্ছিক
| হেল্পার | কখন |
|---|---|
| `useT()("key")` | বারবার ব্যবহৃত টেক্সট (`features/feed/i18n.ts`, `i18n.auth.ts`) |
| `useTr()("বাংলা", "English")` | একটি পেজে একবার ব্যবহৃত টেক্সট |
| `useNum()(n)` | **সব সংখ্যা** — বাংলায় ১২৩, ইংরেজিতে 123। কখনো সংখ্যা সরাসরি `{n}` লিখবেন না |
- নতুন ইউজার-দৃশ্যমান টেক্সট **দুই ভাষাতেই** দিন। বাংলায় ইংরেজি শব্দ শুধু ব্র্যান্ড/টেকনিক্যাল (Google, Steadfast)।
- ফর্মের Zod ভ্যালিডেশন বার্তা এখনও ইংরেজি (`shared/validation`) — অনুবাদ বাকি, §১২-এ আছে।

### ডিজাইন টোকেন (`src/index.css`)
- রং সবসময় টোকেন দিয়ে: `bg-primary`, `text-muted-foreground`, `bg-offer-soft`/`text-offer` (দিচ্ছি = সবুজ), `bg-need-soft`/`text-need` (চাই = অ্যাম্বার), `bg-warning-soft`, `text-success`। **হেক্স/`bg-gray-50`/`text-emerald-600` লিখবেন না** — ডার্ক মোড ভেঙে যাবে।
- ফন্ট: Noto Sans Bengali। `line-height` ১.৬ (যুক্তাক্ষরের জন্য)।
- বর্ডার-রেডিয়াস: কার্ড `rounded-2xl`, বাটন/ইনপুট `rounded-xl`, চিপ `rounded-full`।
- ইনপুটের ফন্ট মোবাইলে **১৬px+** (`text-base`) — নইলে iOS জুম করে।

### রেসপন্সিভ — মোবাইল-ফার্স্ট
| ব্রেকপয়েন্ট | লেআউট |
|---|---|
| < 640 (`sm`) | এক কলাম, নিচে ট্যাব বার, হ্যামবার্গার ড্রয়ার |
| 768 (`md`) | নিচের বার চলে যায়, বাম সাইডবার আসে; চ্যাট এখনও এক-প্যান |
| 1024 (`lg`) | চ্যাট দুই-প্যান; পোস্ট বিস্তারিত ছবি|তথ্য দুই কলাম |
| 1280 (`xl`) | ফিডে ডান সাইড-প্যানেল (টিপস, ক্যাটাগরি, বিজ্ঞাপন) |

নিয়ম: নতুন স্ক্রিন **৩৬০px-এ আগে** বানান। কোনো `min-w-*` বা দীর্ঘ বাটন-লেবেল সারিতে রাখলে `flex-wrap` দিন। স্ক্রল-কনটেইনার ছাড়া অনুভূমিক স্ক্রল **নিষিদ্ধ**।

### অ্যাক্সেসিবিলিটি
- প্রতিটি আইকন-বাটনে `aria-label`/`sr-only`। ফর্মে `label htmlFor`।
- টাচ টার্গেট ≥ 40px। ফোকাস রিং সরাবেন না। কনট্রাস্ট AA (টোকেন এটা নিশ্চিত করে)।
- লিন্ট (`biome`) a11y নিয়ম ব্যর্থ হলে `biome-ignore` দিতে হলে **কারণ লিখুন**।

### ছবি
- সব আপলোডের আগে `compressImage()` (`features/feed/image.ts`) — সর্বোচ্চ ১২৮০px, JPEG ০.৮। ৩–৮ MB → ~২০০ KB।
- দেখানোর সময় সবসময় `<Photo>` কম্পোনেন্ট (লেজি-লোড, ফিক্সড বক্স, ব্যর্থ হলে ক্যাটাগরি-ইমোজি)।

### কমিট
`pnpm --filter web exec tsc -b` + `biome lint` + `biome format` পরিষ্কার না হলে কমিট নয়।

---

## ৪. স্ক্রিন → রাউট → ডেটা (আসল ব্যাকএন্ডের সাথে মিল)

| স্ক্রিন | রাউট | ফাইল | ডেটা-মেথড | বিদ্যমান ব্যাকএন্ড | ফাঁক |
|---|---|---|---|---|---|
| হোম ড্যাশবোর্ড | `/home` | `pages/me/HomeDashboard` | `getDashboard` | **NEW** `GET /api/me/dashboard` | অপেক্ষমাণ কাজ, আপনার জন্য, কাছের দরকার, সম্মিলিত লক্ষ্য — সংখ্যা সার্ভার থেকে (`docs/STUDENT_UX.md`) |
| ফিড | `/feed` | `pages/feed/FeedPage` | `listFeed` | `GET /api/products`, `/api/needs` | **NEW** একীভূত `/api/feed`। ফিল্টার URL-এ (`features/feed/feedParams.ts`); একই নিয়ম `features/data/filtering.ts` → সার্ভারে SQL-এ |
| ম্যাপ ভিউ | `/feed?view=map` | `features/geo/PostMap` (Leaflet, আলাদা chunk) | `listFeed` (একই ফিল্টার) | পোস্টে এলাকার কেন্দ্রবিন্দু (`area_lat/lng`) | দূরে: জেলা-বাবল; কাছে: এলাকা-পিন, কাছাকাছি পিন একত্রে। বাংলাদেশের বাইরে ঝাপসা, সীমানা রেখা (`bdOutline.ts`, Natural Earth)। সর্বোচ্চ জুম ১৫ — কখনো ঠিকানা নয় |
| ম্যাপে পিন | অনবোর্ডিং ধাপ ২ | `features/geo/LocationPicker` | `saveVerificationProfile({pin})` | ঠিকানা টেবিলে `pin_lat/lng` | ~১০০ মিটারে গোল করা (`coarse`); "আমার লোকেশন" ব্রাউজার জিওলোকেশন |
| পোস্ট লেখা | `/post/new`, `/post/new?kind=need` | `pages/feed/QuickPost` | `publishPost` | পোস্ট রুট | নতুন ফিল্ড: `edu {level, detail}`, `delivery[]`, `urgency`, `qty`, `status` |
| রিকোয়েস্ট/রিপোর্ট | কার্ড, `/post/:id?request=1` | `features/feed/PostBits` | `requestItem`, `reportPost` | **NEW** `POST /api/posts/:id/requests`, `POST /api/reports` | |
| সেভ করা খোঁজ | `/saved?tab=searches` | `features/feed/alerts.ts` | (এখন ডিভাইসে) | **NEW** `saved_searches` + মিলে গেলে নোটিফিকেশন | |
| ধন্যবাদ নোট | `/exchanges` | `ExchangesPage` → `ThanksDialog` | `sendThanks` | **NEW** `POST /api/exchanges/:id/thanks` | দাতার প্রোফাইলে দেখায় |
| সার্চ | `/search?q=` | `pages/discover/SearchPage` | `listFeed({q})` | `/api/search` | টেক্সট সার্চ যোগ করা |
| পোস্ট বিস্তারিত | `/post/:id` | `pages/post/PostDetail` | `getPost` | `GET /products/:id`, `/needs/:id` | কোনটি product/need তা বোঝার উপায় (`kind` ফিল্ড) |
| দ্রুত পোস্ট | `/post/new` | `pages/feed/QuickPost` | `aiDraft`, `publishPost` | `POST /products`, `/needs`, `/products/:id/images`, `/publish` | **NEW** `POST /api/ai/draft` |
| আমার পোস্ট | `/my-posts` | `pages/discover/MyPostsPage` | `listFeed` (ফিল্টার) | `GET /products/me` ও needs-এর `me` রাউট | মালিকের ফিল্টার |
| সেভ করা | `/saved` | `pages/discover/SavedPage` | লোকাল স্টোর | — | **NEW** সার্ভার-সাইড সেভ (অ্যাপের সাথে সিঙ্কের জন্য) |
| চ্যাট | `/messages[/:id]` | `pages/messages/MessagesPage` | `listChats`, `sendMessage` | `/api/chat/conversations*` + Socket.io | রিয়েলটাইম সাবস্ক্রিপশন যোগ (§৫ ধাপ ৫) |
| আদান-প্রদান | `/exchanges` | `pages/exchanges2/ExchangesPage` | `listExchanges`, `advanceExchange` | `/api/exchanges*` | ⚠️ **মডেল অমিল** — নিচে |
| কুরিয়ার (ইউজার) | `/courier` | `pages/courier/CourierRequest` | (যোগ হবে) | `/api/shipping` | **NEW** দুজনের সম্মতি → অ্যাডমিন রিকোয়েস্ট |
| প্রোফাইল | `/profile`, `/users/:username` | `pages/me/ProfilePage` | `getUser` | `/api/users/me`, `/:username`, `/api/reviews` | ট্রাস্ট স্কোর `trust.service` থেকে |
| প্রোফাইল এডিট | `/profile/edit` | `pages/discover/EditProfilePage` | (এখন `features/feed/me.ts`) | `PATCH /api/users/me` | অ্যাভাটার, পড়াশোনার স্তর, প্রতিষ্ঠান (+দেখাবে কিনা, ডিফল্ট বন্ধ), আগ্রহ |
| নোটিফিকেশন | `/notifications` | `pages/me/NotificationsPage` | `listNotifications`, `markNotificationRead` | `/api/notifications*` | — (প্রায় সরাসরি) |
| সেটিংস | `/settings` | `pages/me/SettingsPage` | (যোগ হবে) | `/api/users/me/settings` | অ্যাকাউন্ট মুছা |
| সাইন-আপ যাত্রা | `/register` `/verify-email` `/onboarding` | `pages/auth/*` | `otp.api.ts` | `/api/auth/session` | **NEW** ইমেইল OTP, প্রোফাইল-যাচাই সেভ |
| অ্যাডমিন: কুরিয়ার কিউ | `/admin/courier` | `features/admin/pages/courier` | `listCourierRequests`, `decideCourierRequest` | `/api/admin`, `/api/shipping` | **NEW** Steadfast পার্সেল তৈরি |
| বিজ্ঞাপন স্লট (ফিড/সাইডবার/পোস্ট) | — | `features/feed/AdCard` | `getAdConfig`, `trackAd` | **NEW** `GET /api/ads`, `POST /api/ads/:id/events` | §৫.ঘ |
| কুরিয়ার চার্জ পেমেন্ট | `/courier` | `pages/courier/CourierRequest` | `getCheckoutConfig`, `submitCourierPayment` | **NEW** `/api/payments` | §৫.ঙ |

### ৪.১ অ্যাডমিন প্যানেল

ডেটা-স্তর: `features/admin/data` (`AdminSource` ইন্টারফেস → `mockSource` / `apiSource`, ইউজার-সাইডের মতোই `VITE_USE_MOCK` দিয়ে সুইচ)। সব অ্যাকশন (সাসপেন্ড, লুকানো, নিষ্পত্তি, প্রকাশ, ফ্ল্যাগ…) মকে **অডিট লগে লেখা হয়** এবং ড্যাশবোর্ডের বাকি-কাজের সংখ্যা তালিকা থেকে হিসাব হয় — আসল API-তেও একই আচরণ চাই।

| স্ক্রিন | রাউট | কাজ | ব্যাকএন্ড (`/api/admin/*`) |
|---|---|---|---|
| ড্যাশবোর্ড | `/admin` | KPI, ১৪ দিনের চার্ট, "এখনই দেখুন" কিউ, সাম্প্রতিক কাজ | `dashboard/metrics` ✅ (সিরিজ/ক্যাটাগরি/বিজ্ঞাপন **NEW**) |
| অ্যানালিটিক্স | `/admin/analytics` | সাইন-আপ, ক্যাটাগরি, জেলা, বিজ্ঞাপন আয় (অনুমান) | একই + Ad Manager রিপোর্ট API |
| পোস্ট | `/admin/posts` | product+need একসাথে; লুকান/পুনরুদ্ধার/মুছুন | `products`, `needs` ✅ (একীভূত তালিকা **NEW**) |
| রিপোর্ট | `/admin/reports` | কিউ → দেখুন → নিষ্পত্তি/তদন্ত/খারিজ/"পোস্ট লুকিয়ে নিষ্পত্তি" | `GET /api/reports` ✅, নিষ্পত্তির `PATCH` **NEW** |
| যাচাই | `/admin/verification` | শুধু স্বয়ংক্রিয় যাচাইয়ে ধরা সন্দেহজনক অ্যাকাউন্ট (NID নেই) | **NEW** ফ্ল্যাগ-তালিকা; `PATCH verifications/:id/status` ✅ |
| রিভিউ | `/admin/reviews` | চিহ্নিত রিভিউ মুছা | **NEW** |
| ইউজার | `/admin/users` | খোঁজা, সাসপেন্ড/সচল | `users` ✅, `users/:id/status` ✅ |
| লেনদেন | `/admin/exchanges` | তদারকি, বিরোধে বাতিল | `exchanges` ✅ (§৪-এর মডেল সিদ্ধান্ত লাগবে) |
| কুরিয়ার | `/admin/courier` | কিউ, যাচাই, কনফার্ম → ট্র্যাকিং | **NEW** (§৫.গ) |
| ক্যাটাগরি | `/admin/categories` | যোগ/সম্পাদনা/চালু-বন্ধ | `GET /api/categories` ✅, লেখার রুট **NEW** |
| পেজ কনটেন্ট | `/admin/cms` | শর্তাবলী/প্রাইভেসি/আমাদের কথা/সাহায্য সম্পাদনা, খসড়া/প্রকাশ | `cms` ✅ — **পাবলিক `/terms`, `/privacy` পেজকে এখান থেকে পড়াতে হবে** (এখন হার্ডকোডেড খসড়া) |
| ফ্রড ও ঠিকানা চেক | `/admin/risk` | রিকোয়েস্টের ঝুঁকি স্কোর, ঠিকানা যাচাই, কুরিয়ার ইতিহাস; অনুমোদন/হোল্ড/বাতিল(+ব্লক); নম্বর যাচাই; ব্লকলিস্ট | **NEW** (§৫.চ) |
| পেমেন্ট | `/admin/payments` | কুরিয়ার চার্জ: bKash/Nagad TrxID যাচাই → গ্রহণ/প্রত্যাখ্যান(কারণসহ)/রিফান্ড, COD; পদ্ধতি, নম্বর, চার্জ-রেট, কখন আগাম বাধ্যতামূলক | **NEW** (§৫.ঙ) |
| বিজ্ঞাপন ম্যানেজার | `/admin/ads` | নিজের বিজ্ঞাপন যোগ/সম্পাদনা/থামানো/মুছা (ছবি, লিংক, জায়গা, জেলা/ক্যাটাগরি টার্গেট, সময়সূচি, অগ্রাধিকার, ফলাফল); AdX নেটওয়ার্ক কোড, ad unit, ফ্রিকোয়েন্সি | **NEW** (§৫.ঘ) |
| API ও ইন্টিগ্রেশন | `/admin/integrations` | Gemini, Steadfast, ইমেইল, Firebase, ম্যাপ, bKash, Nagad, SMS, Ad Manager — কী সেট, চালু/বন্ধ, sandbox/live, টেস্ট, webhook URL, লঞ্চ-প্রস্তুতি | **NEW** (§৫.ছ), শুধু `super_admin` |
| ফিচার ফ্ল্যাগ | `/admin/features` | চালু/বন্ধ; ঝুঁকিপূর্ণ বন্ধে নিশ্চিতকরণ | `feature-flags` ✅ |
| সেটিংস | `/admin/settings` | AI সীমা, ছবি সংখ্যা, মেয়াদ, মেইনটেন্যান্স | `settings` ✅ |
| অডিট লগ | `/admin/audit` | খোঁজা, CSV এক্সপোর্ট | `audit-logs` ✅ |

**ভূমিকা (role):** `super_admin | admin | moderator` — `features/admin/permissions.ts` (`ACCESS` ম্যাপ) মেনু লুকায় ও `RequireArea` পেজ আটকায়। মডারেটর শুধু পোস্ট/রিপোর্ট/যাচাই/রিভিউ/লেনদেন দেখে; ইউজার-সাসপেন্ড, কুরিয়ার, ক্যাটাগরি, CMS, অ্যানালিটিক্স, বিজ্ঞাপন, অডিট `admin+`; সেটিংস, ফিচার ফ্ল্যাগ ও **API ও ইন্টিগ্রেশন** শুধু `super_admin`; পেমেন্ট `admin+`; ফ্রড চেক মডারেটরও পারে। **এটি শুধু UI সুবিধা — আসল সুরক্ষা সার্ভারের `requireAdmin([...])`; কখনো UI-র ওপর ভরসা করবেন না।** `adminRole` কোথা থেকে আসবে (Firebase custom claim নাকি `users` টেবিল) তা ঠিক করে `useAdminRole()`-এ জুড়ুন; অজানা হলে সবচেয়ে কম অধিকার (moderator) ধরা হয়।

**UI-র বাকি:** অ্যাডমিন পেজগুলোতে রিয়েলটাইম নেই (প্রতি পেজ খুললে লোড); বড় তালিকায় পেজিনেশন নেই (শুরুতে হাজারের নিচে ঠিক আছে, §১২-এ আছে)।

### ⚠️ সবচেয়ে গুরুত্বপূর্ণ ফাঁক: ব্যাকএন্ড বার্টার-মডেল, প্রোডাক্ট বিনামূল্যে-দান

বিদ্যমান স্কিমা অদলবদলের জন্য বানানো (`full_migration.sql`):
- `exchanges.offered_product_ids` + `requested_product_ids` (পণ্যের বদলে পণ্য), `counter_offered` স্ট্যাটাস
- `products.exchange_preference NOT NULL` (কী বদলে চাই)
- `exchange_status`: `pending, counter_offered, accepted, rejected, cancelled, expired, ready_for_shipping`
- `verification_document_type`: `national_id, passport, driving_license` (আপনি NID বাধ্যতামূলক করেননি)

UI-র মডেল: `requested → accepted → scheduled → completed | cancelled`। **সংযোগের আগে সিদ্ধান্ত নিন (স্কিমা মাইগ্রেশন লাগবে):**

| UI স্ট্যাটাস | ব্যাকএন্ড |
|---|---|
| requested | `pending` |
| accepted | `accepted` |
| scheduled | **নেই** → নতুন কলাম `scheduled_at` বা স্ট্যাটাস |
| completed | **নেই** → নতুন স্ট্যাটাস `completed` + দুই পক্ষের কনফার্ম (`giver_confirmed_at`, `receiver_confirmed_at`) |
| courier_ready | `ready_for_shipping` ✅ |

প্রস্তাব: নতুন `gift_requests` টেবিল (post_id, requester_id, message, delivery_method, status) — বার্টার-এক্সচেঞ্জ টেবিল না ঘেঁটে। পুরোনো বার্টার ফিচার বন্ধ রাখুন (`counter` এন্ডপয়েন্ট ব্যবহার হবে না)। `products.exchange_preference`-এ ধ্রুবক `"free"` বসান বা কলামটি nullable করুন।

---

## ৫. ব্যাকএন্ড সংযোগের ক্রম (প্রতি ধাপ শেষে ব্রাউজারে যাচাই)

1. **অথ ও প্রোফাইল** — `/api/auth/session`; `otp.api.ts`-এ ইমেইল-কোড (§৫.ক); `getUser`।
2. **ক্যাটাগরি** — `/api/categories` (UI-র `CATEGORIES` ধ্রুবক সরিয়ে সার্ভার থেকে; আইডি মিলিয়ে নিন)।
3. **ফিড ও পোস্ট** — `listFeed`, `getPost`, `publishPost` + ছবি আপলোড (§৬.খ)।
4. **রিকোয়েস্ট/এক্সচেঞ্জ** — §৪-এর মডেল সিদ্ধান্তের পর `listExchanges`, রিকোয়েস্ট পাঠানো (PostDetail-এর ডায়ালগ এখন শুধু লোকাল)।
5. **চ্যাট** — `listChats`/`sendMessage` + Socket.io (`SocketProvider`, `useChatRealtime` আগে থেকে আছে — `invalidateQueries(chats)` কল করুন নতুন মেসেজে)।
6. **নোটিফিকেশন + FCM** — `useFCM` আছে।
7. **AI ড্রাফট** (§৫.খ)।
8. **কুরিয়ার + Steadfast** (§৫.গ)।
9. **বিজ্ঞাপন** (§৫.ঘ)।
10. **অ্যাডমিন** — বাকি পেজ (`Users`, `Reports`…) বিদ্যমান API-তে ইতিমধ্যে যুক্ত; শুধু নতুন ডিজাইনে মানিয়ে নিন।

### ৫.ক ইমেইল OTP
Firebase Auth ডিফল্টে **লিংক** পাঠায়, কোড নয়। তাই:
- `POST /api/auth/email-code/send` → ৬ সংখ্যা তৈরি, **হ্যাশ** করে DB-তে, মেয়াদ ১০ মিনিট, ইউজার প্রতি ঘণ্টায় সর্বোচ্চ ৫ বার; Resend/Brevo দিয়ে পাঠান।
- `POST /api/auth/email-code/verify` → সর্বোচ্চ ৫ ভুল চেষ্টা, তারপর লক; সঠিক হলে `email_verified=true` (Firebase custom claim)।
- ডোমেইনে SPF/DKIM/DMARC সেট করুন, নইলে কোড স্প্যামে যাবে।
- UI-তে `otp.api.ts`-এর তিনটি ফাংশন বদলান; **`import.meta.env.DEV` গার্ড সরান**।

### ৫.খ AI ড্রাফট (Gemini ফ্রি টিয়ার)
- `POST /api/ai/draft` (multipart, ≤৫ ছবি, প্রতিটি ≤১ MB — ক্লায়েন্ট আগেই কম্প্রেস করে)।
- সার্ভার Gemini-কে **স্ট্রাকচার্ড JSON** চাইবে: `{title, description, category, condition, prohibited}`। `prohibited=true` হলে ৪২২ + কারণ।
- **কী ক্লায়েন্টে নয়।** ইউজার প্রতি দৈনিক সীমা (প্রস্তাব ১৫), গ্লোবাল রেট-লিমিট; ফ্রি টিয়ারের RPM/RPD সীমা ছাড়ালে ৪২৯ → UI `aiLimit` বার্তা + ম্যানুয়াল ফর্ম (এই আচরণ UI-তে তৈরি)।
- ফ্রি টিয়ারে ডেটা Google উন্নয়নে ব্যবহার হতে পারে — প্রাইভেসি পলিসিতে আছে (§৬.গ)। ব্যবহারকারী বাড়লে পেইড টিয়ারে যান।
- ছবিতে মানুষের মুখ থাকলে প্রম্পটে বলুন "ব্যক্তিগত তথ্য বিবরণে লিখবে না"।

### ৫.গ কুরিয়ার (Steadfast) — অ্যাডমিন-অনুমোদিত
1. দুজনেই সম্মতি দিলে `POST /api/shipping/courier-requests` (সম্মতির দুই টাইমস্ট্যাম্প, পিকআপ/ডেলিভারি ঠিকানা **স্ন্যাপশট**, আনুমানিক ওজন, চার্জ)।
2. **কনফার্মের শর্ত (সার্ভারেও একই নিয়ম):** রিকোয়েস্টের ফ্রড চেক `approved` (§৫.চ) এবং পেমেন্ট `pending`/`rejected` নয় (§৫.ঙ)। UI কনফার্ম বোতাম বন্ধ রেখে কারণ ও লিংক দেখায় (`CourierQueue.tsx` → `blockers()`)।
3. অ্যাডমিন কিউ → `POST /api/admin/courier-requests/:id/confirm` → সার্ভার Steadfast API দিয়ে পার্সেল তৈরি (COD = চার্জ, গ্রহীতা দেবেন) → `tracking_code` সেভ → দুজনকে ইমেইল + FCM → exchange `ready_for_shipping`।
4. Steadfast ওয়েবহুক/পোলিং দিয়ে স্ট্যাটাস সিঙ্ক (`picked_up → in_transit → delivered | returned`)।
5. Steadfast কী শুধু সার্ভারে (§৫.ছ)। ঠিকানা কেবল কনফার্ম হওয়ার পরই কুরিয়ারকে যায়।
6. ফেরত/প্রত্যাখ্যান নীতি: গ্রহীতা না নিলে ট্রাস্ট স্কোর কমবে (UI-তে সম্মতির সময় বলা আছে)।

### ৫.ঘ বিজ্ঞাপন (Google Ad Manager / AdX)
দুই ধরনের বিজ্ঞাপন, দুটোই অ্যাডমিনের **বিজ্ঞাপন ম্যানেজার** থেকে:
- **নিজের (direct) বিজ্ঞাপন** — টেবিল `ad_campaigns` (advertiser, headline, body, cta, url, image_url, placements[], districts[], categories[], start, end, weight, paused) + `ad_events` (ad_id, type, session_id, created_at)। `GET /api/ads?placement=&district=&category=` সার্ভারে সময়সূচি/টার্গেট ফিল্টার করে ও `weight` অনুযায়ী ঘোরায়; ব্রাউজারে শুধু `PublicAd` (পরিসংখ্যান বা টার্গেট নিয়ম যায় না)। ইমপ্রেশন = কার্ডের ৫০% স্ক্রিনে এলে একবার; ক্লিক = লিংকে। সার্ভারে সেশন-প্রতি ডুপ্লিকেট ও বট বাদ দিন। লিংক শুধু `http(s)` (`safeAdUrl`), `rel="sponsored noopener noreferrer"`। ছবি সাইনড আপলোডে স্টোরেজে।
- **AdX (Google Ad Manager)** — নেটওয়ার্ক কোড ও ad unit অ্যাডমিনে বসে। `AdxSlot` কন্টেইনারে `data-ad-unit` আছে; GPT স্ক্রিপ্ট (`securepubads.g.doubleclick.net/tag/js/gpt.js`) লোড করে `defineSlot('/<network><unit>', 'fluid', id)` দিয়ে রেন্ডার করুন; **ফাঁকা ফিরলে কার্ড লুকান**। `priority`: নিজের আগে / সবসময় AdX / পালা করে।
- ফ্রিকোয়েন্সি ও পেজ-প্রতি সীমা `ad_network_settings` থেকে (`FeedPage` এখন `useAdConfig` থেকেই পড়ে)।
- `public/ads.txt` লাগবে (AdX থেকে লাইন কপি করুন)। কুকি সম্মতি ব্যানার (GDPR-স্টাইল) বানান — বাংলাদেশে বাধ্যতামূলক না হলেও Google-এর পলিসি ও EU ভিজিটরের জন্য নিরাপদ।
- নিষিদ্ধ: চ্যাট, ভেরিফিকেশন, ঠিকানা, কুরিয়ার ও পেমেন্ট পেজে বিজ্ঞাপন (বর্তমান লেআউটে নেই — যোগ করবেন না)।

### ৫.ঙ পেমেন্ট (কুরিয়ার চার্জ — গ্রহীতা দেন)
প্ল্যাটফর্ম বিনামূল্যে; টাকা লাগে শুধু কুরিয়ার চার্জে।
- **COD (ডিফল্ট):** Steadfast পার্সেলে `cod_amount = চার্জ`; ডেলিভারি ওয়েবহুকে `cod_collected`। কোনো গেটওয়ে লাগে না।
- **আগাম bKash/Nagad (হাতে যাচাই):** গ্রহীতা অ্যাডমিনের সেট করা নম্বরে পাঠিয়ে TrxID + প্রেরক নম্বর দেন → `payments` সারি `pending` → অ্যাডমিন মার্চেন্ট অ্যাপে মিলিয়ে `verified` বা কারণসহ `rejected` (ইমেইলে জানানো)। সার্ভার স্বয়ংক্রিয় ফ্ল্যাগ দেয়: **একই TrxID আগে ব্যবহৃত** (UNIQUE ইনডেক্স + ফ্ল্যাগ), প্রেরক নম্বর ইউজারের নম্বরের সাথে না মেলা, টাকার পরিমাণ না মেলা।
- **গেটওয়ে (ঐচ্ছিক, পরে):** bKash Tokenized Checkout / Nagad — ইন্টিগ্রেশনে কী দিলে callback (`/api/payments/bkash/callback`) নিজেই `verified` করবে; রিফান্ডও API দিয়ে। মার্চেন্ট অ্যাকাউন্ট লাগবে।
- চার্জ-রেট (ঢাকা/আশেপাশে/বাইরে, মূল ওজন, বাড়তি কেজি) অ্যাডমিনে; চার্জ **সার্ভারে** হিসাব হবে (`courierCharge()` একই সূত্র), ক্লায়েন্টের পাঠানো টাকা বিশ্বাস করবেন না।
- `advanceFrom`: এই ঝুঁকি-স্তর থেকে COD বন্ধ, আগাম বাধ্যতামূলক — ফেরত পার্সেলের খরচ বাঁচায়।
- টেবিল: `payments` (id, courier_request_id, payer_id, amount, method, trx_id UNIQUE NULLS, sender_number, status, flags[], note, decided_by, timestamps), `payment_settings` (এক সারি)।

### ৫.চ ফ্রড ও ঠিকানা চেক
প্রতিটি কুরিয়ার রিকোয়েস্ট তৈরির সময় সার্ভার `risk_cases` সারি বানায়, সিগন্যাল ও স্কোর হিসাব করে (`features/admin/risk.ts`-এর একই সূত্র: fail = পুরো ওজন, warn = অর্ধেক; ≥৬০ উচ্চ, ≥৩০ মাঝারি)।
- সিগন্যাল: ব্লকলিস্ট, ইমেইল যাচাই, সঠিক বিডি মোবাইল, একই নম্বর একাধিক অ্যাকাউন্টে, অ্যাকাউন্টের বয়স, ২৪ ঘণ্টায় রিকোয়েস্ট সংখ্যা, **ঠিকানা** (জেলা তালিকায় আছে কিনা, থানা, বাড়ি/রোড নম্বরসহ পূর্ণ লাইন; ম্যাপ ইন্টিগ্রেশন থাকলে জিওকোড মেলানো), কুরিয়ার ইতিহাস (নেওয়া/ফেরত %), রিপোর্ট।
- **কুরিয়ার ইতিহাস:** নিজের প্ল্যাটফর্মের ডেলিভারি রেকর্ড সবসময়। Steadfast-এর "fraud check" মার্চেন্ট প্যানেলে আছে, কিন্তু **নথিভুক্ত পাবলিক API নিশ্চিত নয়** — Steadfast সাপোর্টে জিজ্ঞেস করে নিন; না পেলে শুধু নিজের রেকর্ড।
- অ্যাডমিন: অনুমোদন / হোল্ড (আগাম পেমেন্ট চাওয়া) / বাতিল (+নম্বর ব্লক)। ব্লক করা ফোন/ইমেইল/ঠিকানা/ডিভাইস দিয়ে সাইন-আপ ও রিকোয়েস্ট সার্ভারে আটকান।
- রুট: `GET/PATCH /api/admin/risk`, `GET /api/admin/risk/phone/:phone`, `/api/admin/blocklist`।

### ৫.ছ API ও ইন্টিগ্রেশন (কী অ্যাডমিন থেকে)
সব বাইরের সেবার কী `super_admin` অ্যাডমিন প্যানেল থেকে বসাতে/বদলাতে পারেন — সার্ভার রিস্টার্ট লাগে না।
- টেবিল `integration_settings` (id, enabled, mode, public_values jsonb, **secret_values bytea — AES-256-GCM এনক্রিপ্টেড**, last_check jsonb, updated_by)। মাস্টার কী `SETTINGS_ENCRYPTION_KEY` (৩২ বাইট) **শুধু সার্ভার env-এ**।
- API কখনো সিক্রেট ফেরত দেয় না — শুধু `{ set, last4 }`। খালি স্ট্রিং পাঠালে মুছে যায়; না পাঠালে আগেরটা থাকে।
- পড়ার ক্রম: ডাটাবেসের মান → না থাকলে env (`GEMINI_API_KEY` ইত্যাদি) — তাই পুরোনো env সেটআপও চলবে।
- `POST /api/admin/integrations/:id/test` সার্ভার থেকে প্রোভাইডারকে হালকা কল দেয় (Gemini: মডেল তালিকা; Steadfast: ব্যালেন্স; ইমেইল: ডোমেইন স্ট্যাটাস; bKash: টোকেন) এবং ফলাফল `last_check`-এ রাখে। কী বদলালে `last_check` মুছে "টেস্ট বাকি" হয়।
- নিরাপত্তা: কী বদলাতে পাসওয়ার্ড/২-ধাপ আবার চাওয়া (re-auth) ভালো; অডিট লগে **কে কোন সেবার কোন ফিল্ড বদলেছে** থাকে, মান কখনো না; রেট-লিমিট।
- ওয়েবের Firebase কনফিগ (`VITE_FIREBASE_*`) বিল্ডের সময় লাগে, তাই ওটা এখান থেকে নয়।

---

## ৬. যে তিনটি বিষয় খোলা ছিল — সমাধান

### (ক) পুরোনো ব্যাকএন্ড-যুক্ত পেজের কী হবে?
- রাউট এখন সব **নতুন পেজে**। পুরোনো URL (`/products`, `/needs`, `/my-products`, `/search/*`, `/dashboard/*` ইত্যাদি) **রিডাইরেক্ট** করে নতুন পেজে (`App.tsx`)। বুকমার্ক ভাঙবে না।
- পুরোনো পেজ ফাইল (`pages/products`, `pages/needs`, `pages/chat`, `pages/exchanges`, `pages/dashboard` …) ডিস্কে আছে, রাউট নেই। এগুলো **রেফারেন্স** — ওখানকার API-কল (`services/api/services/*.service.ts`) `apiSource.ts` লেখার সময় কাজে লাগবে।
- **সিদ্ধান্ত:** ব্যাকএন্ড সংযোগ শেষ হলে (§৫ ধাপ ১০ পর্যন্ত) পুরোনো পেজ ফোল্ডারগুলো মুছে ফেলুন। তার আগে নয়। কয়েকটি পেজে ইউনিক ফিচার আছে যা নতুনে নেই (মূল্য-অনুমান, মডেল/ব্র্যান্ড ফিল্ড, `PersonalAnalytics`) — PRD অনুযায়ী এগুলো এই ফেজে লাগবে না।

### (খ) আসল ছবি
- UI প্রস্তুত: `Photo` কম্পোনেন্ট `post.images[i]` দেখায় (ছবি না থাকলে/লোড না হলে ইমোজি), পোস্ট পেজে গ্যালারি+থাম্বনেইল, ক্লায়েন্টে কম্প্রেশন।
- সংযোগ: `POST /api/products/:id/images` (multer) আছে। Supabase Storage বাকেটে সংরক্ষণ → **সর্বজনীন URL** `images: string[]`-এ।
- সার্ভারে আবার যাচাই করুন: MIME (jpeg/png/webp), সর্বোচ্চ সাইজ ২ MB, ছবি-প্রতি-পোস্ট ৫টি; EXIF GPS **মুছে ফেলুন** (ইউজারের সঠিক অবস্থান ফাঁস রোধ)।
- থাম্বনেইল তৈরি (৪০০px) করলে ফিড দ্রুত হবে — Supabase image transform বা সার্ভারে `sharp`।
- NSFW/নিষিদ্ধ জিনিস শনাক্তে Gemini-র `prohibited` ফ্ল্যাগ ব্যবহার (§৫.খ)।

### (গ) আইনি (শর্তাবলী/প্রাইভেসি)
`/terms`, `/privacy` এখন **খসড়া** (পেজেই সতর্কতা দেখায়)। লঞ্চের আগে:
1. আইনজীবীকে দিয়ে চূড়ান্ত করুন — বিশেষ করে: ঠিকানা/ফোন সংরক্ষণ ও শেয়ার (কুরিয়ার, অপর পক্ষ), শিশুদের ডেটা, প্রতারণার দায় (প্ল্যাটফর্ম মধ্যস্থতাকারী মাত্র), নিষিদ্ধ জিনিস, অ্যাকাউন্ট মুছার অধিকার।
2. প্রকাশ করুন: Gemini-তে ছবি যায়, Google বিজ্ঞাপন/কুকি, Steadfast-কে ঠিকানা যায়, ইমেইল প্রদানকারী।
3. AdSense/AdX অনুমোদনে সাইটে প্রাইভেসি পলিসি + যোগাযোগ + ‘আমাদের কথা’ থাকা লাগে — তিনটিই আছে (ঠিকানা/ইমেইল `support@reusedo.app` আপনার আসল ইমেইলে বদলান)।
4. Play Store/App Store-এ প্রাইভেসি লিংক ও ডেটা-সেফটি ফর্ম লাগবে (§১০)।
5. অ্যাকাউন্ট মুছার কার্যকর ফ্লো (সেটিংসে বোতাম আছে, ব্যাকএন্ড বাকি) — **Apple ও Google দুজনেই বাধ্যতামূলক চায়**।

---

## ৬.৫ হোস্টিং — কোথায় কী চলবে (সুপারিশ)

**সিদ্ধান্ত: ওয়েব Firebase Hosting-এ, ডেটা Supabase-এ।** Vercel লাগবে না।

| অংশ | কোথায় | কেন |
|---|---|---|
| ওয়েব (এই React অ্যাপ) | **Firebase Hosting** — ফ্রি `*.web.app` ঠিকানা | লগইন আগে থেকেই Firebase-এ; ফ্রি SSL ও CDN; পরে নিজের ডোমেইন এক ক্লিকে জোড়া যায়। `firebase.json`-এ SPA rewrite আছে |
| ডেটাবেস, ছবি, রিয়েলটাইম চ্যাট | **Supabase** (Postgres + Storage + Realtime) | কোড আগে থেকেই Supabase-এর জন্য লেখা; ফ্রি টিয়ারে শুরু করা যায় |
| লগইন ও পুশ নোটিফিকেশন | **Firebase Auth + FCM** | Flutter অ্যাপেও একই অ্যাকাউন্ট চলবে |
| গোপন কী লাগে এমন সার্ভার কাজ (Gemini, Steadfast, ইমেইল, পেমেন্ট) | এখন: বিদ্যমান Express API **Render**-এ (`render.yaml`)। পরে চাইলে: **Supabase Edge Functions** | Render-এর ফ্রি প্ল্যান ১৫ মিনিট পর ঘুমিয়ে পড়ে (প্রথম রিকোয়েস্টে ৩০–৫০ সেকেন্ড দেরি) — লঞ্চের সময় পেইড প্ল্যান ($7/মাস) নিন, অথবা কাজগুলো Edge Functions-এ সরান |

কেন Vercel নয়: Vercel ভালো হোস্টিং, কিন্তু ডাটাবেস দেয় না আর এই প্রজেক্টের Socket.io (রিয়েলটাইম চ্যাট) তার সার্ভারলেসে চলে না — তাহলে তিনটা আলাদা সেবা সামলাতে হতো। Firebase-এর Cloud Functions বাইরের API (Gemini, Steadfast) ডাকতে Blaze (কার্ড লাগে) প্ল্যান চায়, তাই সেটাও এখন নয়।

ডিপ্লয় (একবার সেটআপের পর): `pnpm --filter @reusedo/web build` → `firebase deploy --only hosting:web`। `.firebaserc`-এ প্রজেক্ট `binimoy-we` (পুরোনো নাম) — নতুন Firebase প্রজেক্ট বানালে এটা বদলাবেন। `firebase.json`-এর `admin` টার্গেট এখন অপ্রয়োজনীয় (অ্যাডমিন ওয়েব অ্যাপের ভেতরেই `/admin`)।

---

### ম্যাপ টাইল
`VITE_MAP_TILE_URL` খালি থাকলে OpenStreetMap-এর ফ্রি সার্ভার ব্যবহার হয় — ডেভেলপমেন্টে ঠিক আছে, কিন্তু OSM-এর নীতি অনুযায়ী অ্যাপের পুরো ট্রাফিক সেখানে চালানো যায় না। লঞ্চের আগে Barikoi (বাংলাদেশি, বাংলা লেবেল) বা MapTiler-এর কী নিয়ে URL বসান; Admin → API-তে "ম্যাপ" ইন্টিগ্রেশনও সেই কী ব্যবহার করবে (জিওকোডিং)। অ্যাট্রিবিউশন লেখা সরাবেন না।

---

## ৭. এনভায়রনমেন্ট ও সিক্রেট

পূর্ণ তালিকা: `.env.example`। নিয়ম:
- `VITE_*` ব্রাউজারে যায় — **এতে সিক্রেট রাখবেন না**। Firebase web key ও Supabase anon key প্রকাশ্য-নিরাপদ (সুরক্ষা আসে RLS ও Firebase rules থেকে)।
- `SETTINGS_ENCRYPTION_KEY` (অ্যাডমিন থেকে বসানো API কী এনক্রিপ্টের মাস্টার কী, §৫.ছ), `GEMINI_API_KEY`, `STEADFAST_*`, `EMAIL_PROVIDER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PRIVATE_KEY` — শুধু সার্ভারে (Render env)।
- ⚠️ **`.env.production` গিটে কমিট করা আছে।** এখনকার মানগুলো শুধু প্রকাশ্য ক্লায়েন্ট কী (সার্ভার সিক্রেট ফাঁকা — যাচাই করা হয়েছে), তবু ফাইলটি `git rm --cached .env.production` করে `.gitignore`-এ দিন; মান CI/Render-এ রাখুন। ভুলে সিক্রেট ঢুকে গেলে পুরোনো কমিটেও থেকে যায় — তখন কী **রোটেট** করতে হবে।
- রুটে ছড়ানো স্ক্রিপ্ট (`fix_*.py`, `test-*.js`, `split_migration_*`, `create_bucket.*`, `lint_errors.txt`, `binimoy_files.txt`) — ক্লিনআপ করুন (`scripts/`-এ নিন বা মুছুন)।

---

## ৮. UI দ্রুত দেখা ও পরীক্ষা

```bash
pnpm install
VITE_UI_PREVIEW=true pnpm --filter web dev     # লগইন/ব্যাকএন্ড ছাড়া সব স্ক্রিন
```
- `VITE_UI_PREVIEW` শুধু **ডেভে** কাজ করে (`import.meta.env.DEV` গার্ড) — প্রোডাকশন বিল্ডে চালু হওয়া অসম্ভব।
- মক ডেটায় মেসেজ পাঠানো, এক্সচেঞ্জ গ্রহণ, নোটিফিকেশন পড়া, কুরিয়ার কনফার্ম সবই কাজ করে।
- অ্যাডমিন দেখতে: `/admin`, `/admin/courier`, `/admin/risk`, `/admin/payments`, `/admin/ads`, `/admin/integrations`।

### রিলিজের আগে পরীক্ষা (প্রতিটি PR-এ)
1. `pnpm --filter web exec tsc -b` — ত্রুটি ০
2. `pnpm --filter web exec biome lint src` — ত্রুটি ০
3. `pnpm --filter web build` — সফল
4. **৫ প্রস্থে** (360, 390, 768, 1024, 1440) সব রাউট: অনুভূমিক ওভারফ্লো নেই, কনসোল ত্রুটি নেই
5. কীবোর্ড দিয়ে মূল ফ্লো (ট্যাব, এন্টার, Esc দিয়ে ডায়ালগ বন্ধ)
6. ডার্ক মোডে মূল ৫ স্ক্রিন
7. ধীর নেটওয়ার্ক (DevTools → Slow 3G): ফিড স্কেলেটন দেখায়, ত্রুটিতে "আবার চেষ্টা"

> একটি স্বয়ংক্রিয় ৫-প্রস্থ অডিট ও ফ্লো-টেস্ট এই সেশনে চালানো হয়েছে (৩২ রাউট × ৫ প্রস্থ + ১০টি ফ্লো পরীক্ষা সফল)। এটাকে স্থায়ী করতে Playwright টেস্ট হিসেবে `apps/web/e2e/` ও CI-তে যোগ করা **সুপারিশ** (§১২)।

---

## ৯. PWA (ওয়েবকে অ্যাপের মতো ব্যবহার)

আছে: ইনস্টলযোগ্য ম্যানিফেস্ট (`standalone`, `start_url=/feed`, বাংলা নাম), আইকন (১৯২/৫১২/maskable/Apple), `viewport-fit=cover` + `pb-safe` (আইফোন নচ), শর্টকাট ("নতুন পোস্ট", "মেসেজ"); `/api/*` পাথে SPA নেভিগেশন-ফলব্যাক বন্ধ, আর API রেসপন্স প্রিক্যাশে নেই (শুধু স্ট্যাটিক ফাইল ক্যাশ হয়) — ফিড/চ্যাট পুরোনো দেখানোর ঝুঁকি নেই।
- সার্ভিস ওয়ার্কার এখন `autoUpdate` — নতুন সংস্করণ নিজে আপডেট হয়।
- পুরোনো ‘সব SW আনরেজিস্টার’ স্ক্রিপ্ট `index.html` থেকে সরানো হয়েছে (ওটা PWA বন্ধ করে দিত)। যারা পুরোনো SW-সহ সাইট খুলেছিল তারা প্রথম আপডেটে ঠিক হবে।
- বাকি: অফলাইন পেজ, পুশ-নোটিফিকেশন অনুমতির সময়মতো অনুরোধ (লোডের সময় নয়, প্রথম রিকোয়েস্ট পাঠানোর পর)।

---

## ১০. Flutter অ্যাপ (Android + iOS) — ওয়েব চালুর পর

**শর্ত:** ওয়েব + API স্থিতিশীল। অ্যাপ নতুন কোনো ব্যাকএন্ড লজিক ধরবে না — **একই `/api/*`**।

### ১০.১ কেন এখন প্রস্তুতি হিসেবে যা করা হয়েছে
- `DataSource` ইন্টারফেস = Flutter-এ `abstract class PostRepository…`-এর সরাসরি নকশা। একই মেথড-নাম, একই আকৃতি।
- ডিজাইন টোকেন (রং, রেডিয়াস, ফন্ট) `index.css`-এ এক জায়গায় → Flutter `ThemeData`-তে এক-থেকে-এক তুলে নিন।
- স্ট্রিং i18n কেন্দ্রীভূত → ARB ফাইলে রূপান্তর সহজ।
- ইমেইল-কোড ও AI ডেটাপথ সার্ভারে → অ্যাপে কী নেই।

### ১০.২ শুরুর আগে করণীয়
1. **OpenAPI স্পেক**: Zod স্কিমা থেকে `zod-to-openapi` দিয়ে `openapi.json` বানান → Dart ক্লায়েন্ট জেনারেট (`openapi_generator`/`dio`)। হাতে লেখা মডেল নয়।
2. **API ভার্সনিং**: `/api/v1` — অ্যাপ স্টোরে পুরোনো সংস্করণ বছর চলে; ব্রেকিং চেঞ্জ করলে অ্যাপ ভাঙবে।
3. **অথ**: Firebase Auth → Flutter-এ `firebase_auth`; একই টোকেন `Authorization: Bearer`।
4. **রিয়েলটাইম**: Socket.io → `socket_io_client`।

### ১০.৩ প্রস্তাবিত Flutter স্ট্যাক
| বিষয় | প্যাকেজ |
|---|---|
| স্টেট/ডেটা | `riverpod` + `dio` + জেনারেটেড ক্লায়েন্ট |
| নেভিগেশন | `go_router` (ওয়েব রাউটের সাথে হুবহু পাথ — ডিপ লিংকের জন্য) |
| পুশ | `firebase_messaging` (Android) + APNs কী Firebase-এ (iOS) |
| ক্যামেরা/গ্যালারি | `image_picker` + `flutter_image_compress` (ওয়েবের ১২৮০px/০.৮ নিয়ম) |
| ম্যাপ/লোকেশন | `geolocator`, `google_maps_flutter` |
| বিজ্ঞাপন | `google_mobile_ads` — **Native Advanced** ফিডে প্রতি ৬ পোস্টে (ওয়েবের মতোই `ads_frequency`) |
| স্থানীয় সংরক্ষণ | `drift`/`hive` (ড্রাফট অফলাইন, PRD §৬) |
| ফন্ট | Noto Sans Bengali (bundle করুন, নেট থেকে নয়) |

### ১০.৪ প্ল্যাটফর্ম-নির্দিষ্ট (এগুলো ভুললে স্টোর রিজেক্ট)
**Android:** `applicationId`, signing key (Play App Signing), `targetSdk` বর্তমান নীতি অনুযায়ী, কেবল দরকারি পারমিশন (ক্যামেরা, লোকেশন-সময়মতো), ডেটা-সেফটি ফর্ম, ৬৪-বিট, অ্যাডাপ্টিভ আইকন।
**iOS:** Apple Developer অ্যাকাউন্ট ($99/বছর), Bundle ID, `Info.plist` ব্যবহার-বর্ণনা (`NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription` — **বাংলা/ইংরেজি স্পষ্ট ভাষায়**), APNs, ATT প্রম্পট (বিজ্ঞাপন ট্র্যাকিং), "Sign in with Apple" **অথবা** সমতুল্য গোপনীয়তা-বান্ধব লগইন (Google লগইন থাকলে Apple Guideline 4.8 অনুযায়ী লাগে — স্টোর রিভিউ চলাকালীন নীতি আবার দেখে নিন), অ্যাপ-ভিতর অ্যাকাউন্ট মুছার অপশন, UGC মডারেশন (রিপোর্ট/ব্লক — **চ্যাট ও পোস্টে আছে; ব্লক বাকি**)।
**দুটোতেই:** UGC অ্যাপের জন্য রিপোর্ট + ব্লক + ২৪-ঘণ্টা মডারেশন প্রতিশ্রুতি; প্রাইভেসি পলিসি URL; টেস্ট অ্যাকাউন্ট রিভিউয়ারদের জন্য।

### ১০.৫ স্ক্রিন সমতা
ওয়েবের প্রতিটি স্ক্রিন (§৪ টেবিল) অ্যাপে একই নাম ও পাথে। মোবাইলে অতিরিক্ত: ক্যামেরা-প্রথম পোস্ট (ওপেনে সরাসরি ক্যামেরা), পুশ ট্যাপে ডিপ লিংক, শেয়ার-শিট।

---

## ১১. লঞ্চ চেকলিস্ট

**প্রযুক্তি**
- [ ] §৪-এর মডেল সিদ্ধান্ত + মাইগ্রেশন
- [ ] §৫ ধাপ ১–১০ সম্পূর্ণ, `VITE_USE_MOCK=false` দিয়ে প্রোডাকশন বিল্ড
- [ ] Supabase RLS প্রতিটি টেবিলে পরীক্ষিত (অন্যের ঠিকানা/ফোন/মেসেজ পড়া যায় না)
- [ ] রেট-লিমিট: লগইন, OTP, AI, মেসেজ, রিকোয়েস্ট
- [ ] ব্যাকআপ (Supabase PITR), এরর মনিটরিং (Sentry), আপটাইম চেক
- [ ] `.env.production` গিট থেকে সরানো; কী রোটেট (প্রয়োজনে)

**কনটেন্ট/আইনি**
- [ ] শর্তাবলী/প্রাইভেসি আইনজীবী-অনুমোদিত
- [ ] নিষিদ্ধ জিনিসের তালিকা (অস্ত্র, ওষুধ, প্রাণী…) পোস্ট ফর্মে দৃশ্যমান
- [ ] রিপোর্ট → অ্যাডমিন কিউ → ২৪ ঘণ্টার মধ্যে ব্যবস্থা
- [ ] সত্যিকারের যোগাযোগ ইমেইল ও ঠিকানা

**আয়**
- [ ] AdX অনুমোদন, `ads.txt`, কুকি ব্যানার, ফ্রিকোয়েন্সি A/B

**শুরুর কৌশল (cold start)**
- [ ] প্রথমে ১–২ শহরে প্রচার (সারা দেশ খোলা থাকলেও) — ফিড এলাকা→জেলা→দেশ ক্রমে দেখায়, তাই ফাঁকা ফিড এড়াতে সীড-কনটেন্ট (NGO/স্কুল পার্টনার)

---

## ১২. পরবর্তী উন্নয়ন (সুপারিশ — আপনি অনুমোদন দিলে)

| অগ্রাধিকার | কাজ | কেন |
|---|---|---|
| 🔴 | Zod ভ্যালিডেশন বার্তা বাংলায় (`shared/validation`) | সাইন-আপ ফর্মে ইংরেজি ত্রুটি |
| 🔴 | ইউজার ব্লক + পোস্ট/প্রোফাইল রিপোর্ট ডায়ালগ (এখন বাটন আছে, ফ্লো নেই) | Apple/Google UGC নীতি |
| 🔴 | অ্যাকাউন্ট মুছার ফ্লো | স্টোর বাধ্যতামূলক |
| 🟠 | Playwright E2E (`apps/web/e2e`) + GitHub Actions | রিগ্রেশন ঠেকাতে |
| 🟠 | পোস্ট এডিট/বন্ধ ("দেওয়া হয়ে গেছে") | এখন `/my-posts` শুধু তালিকা |
| 🟠 | ইনফিনিট স্ক্রল (ফিড পেজিনেশন, কার্সর-ভিত্তিক) | বেশি পোস্টে পারফরম্যান্স |
| 🟡 | ম্যাপ পিন ও দূরত্ব হিসাব (PostGIS) | এলাকা-ভিত্তিক র‍্যাংক |
| 🟡 | লোডিং `Suspense` ফলব্যাক সুন্দর করা, অফলাইন পেজ | UX |
| 🟡 | ব্যাকএন্ড লিন্ট ত্রুটি (`lint_errors.txt`) | কোড-স্বাস্থ্য |

---

## ১৩. "কমপ্লিট" বলার সংজ্ঞা (প্রতিটি স্ক্রিন)

- [ ] ৩৬০ থেকে ১৪৪০px-এ ওভারফ্লো/কাটা লেখা নেই
- [ ] বাংলা ও ইংরেজি দুটোতেই পূর্ণ; সংখ্যা `useNum()` দিয়ে
- [ ] লোডিং / ফাঁকা / ত্রুটি তিনটি অবস্থা আছে
- [ ] কীবোর্ডে চলে; স্ক্রিনরিডার লেবেল আছে
- [ ] লাইট ও ডার্ক দুটোতেই পড়া যায়
- [ ] নকল নয়, আসল ডেটায় যাচাইকৃত (ব্যাকএন্ড সংযোগের পর)
