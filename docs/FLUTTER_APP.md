# ReuseDo Flutter app

`apps/app` — Android, iOS, web, Windows, macOS, Linux from one codebase. Run and layout notes are in `apps/app/README.md`.

## Status

| | |
|---|---|
| Screens | ✅ Welcome, sign-up (with email code), sign-in, onboarding, Home (with donation map), feed + filters, post detail, new post (photos, AI draft, autosave), messages (two-pane on wide screens), exchanges (handover code), courier, notifications, saved, my posts, profile, settings (language, theme) |
| Responsive | ✅ phone bottom bar · tablet rail · desktop side menu; content capped to a readable width |
| Language | ✅ বাংলা default + English, Bangla digits via `t.n()`, bundled Noto Sans Bengali |
| Data | 🟡 sample (`MockSource`) |
| Sign-in | 🟡 sample (`MockAuthRepository`, code `123456`) |
| Admin | — stays on the web (`/admin`); the app is for givers and receivers |
| Checks | `flutter analyze` clean · 8 tests pass · `flutter build web` succeeds |
| Not verified here | Android / iOS / Windows / macOS / Linux builds (no SDKs in the build container). CI runs analyze, test and web build; build the others on a machine with those toolchains |

## Connecting the backend

> The web app now talks to Supabase directly (no API server; see docs/DEPLOY.md). The Flutter app should do the same:
> `supabase_flutter` with `accessToken: () => firebaseUser.getIdToken()`, calling the same tables, views and RPC functions as
> `apps/web/src/features/data/supabaseSource.ts`. The endpoint table below describes the old REST design; the equivalent for each
> row is the Supabase call in that file.


Write `ApiSource implements DataSource` and switch `dataSourceProvider` (`lib/data/providers.dart`).

| `DataSource` method | Endpoint |
|---|---|
| `listFeed`, `getPost`, `publishPost` | `GET /api/feed` (new, unified), `GET /api/posts/:id`, `POST /api/products` / `/api/needs` (+ `/:id/images`, `/publish`) |
| `aiDraft` | `POST /api/ai/draft` (new — server calls Gemini, per-user daily limit, 429 → "write it yourself") |
| `listChats`, `getChat`, `sendMessage` | `GET /api/chat/conversations`, `…/:id`, `POST …/:id/messages` (+ socket, authenticated with the Firebase token) |
| `listExchanges`, `advanceExchange` | `GET /api/exchanges/…`, `POST /api/exchanges/:id/accept` and status transitions |
| `handoverCode`, `confirmHandover` | `GET /api/exchanges/:id/handover-code` (giver), `POST /api/exchanges/:id/handover {code}` (receiver, 5 tries) |
| `listNotifications`, `markNotificationRead` | `GET /api/notifications`, `PATCH /api/notifications/:id/read` |
| `getUser`, `getDashboard` | `GET /api/users/:username`, `GET /api/me/dashboard` (new) |
| `getDonationMap` | `GET /api/stats/donation-map` (new — per-district aggregates, opted-in first names only) |
| `requestItem`, `reportPost`, `sendThanks` | `POST /api/posts/:id/requests`, `POST /api/reports`, `POST /api/exchanges/:id/thanks` |
| `createCourierRequest` | `POST /api/courier-requests` (new — shows in the admin queue; Steadfast parcel is created on admin confirm) |

Auth: implement `AuthRepository` with Firebase Auth (`firebase_core`, `firebase_auth`, add the per-platform config with
`flutterfire configure`), and call `POST /api/auth/email-code/send` and `/verify` — the same endpoints the web app uses.
Send the Firebase ID token as `Authorization: Bearer …` on every API call.

## Before store release

- App icon and splash (`flutter_launcher_icons`, `flutter_native_splash`), bundle id (`com.noklity.reusedo`), signing keys.
- AdMob native ad unit in `lib/widgets/ad_card.dart` (placeholder today); keep ads out of chat, verification and hand-over screens.
- Map tiles: the OpenStreetMap server is for light use only — switch `urlTemplate` in `donation_map.dart` to a tile provider.
- Android 13+: runtime notification permission when push (FCM) is added.
