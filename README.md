# ReuseDo

Give and get used items for free, with verified people in your area (Bangladesh, Bangla-first).

```
apps/
  web/   React 19 + Vite + Tailwind v4 + TanStack Query + Zustand (PWA, includes /admin)
  api/   Express + Zod + Socket.io → Supabase (Postgres, Storage) + Firebase Auth
supabase/migrations/   the database schema (one baseline file)
docs/    PRD, build guide, UX rules, feature list
```

Requires Node 20+ and pnpm 9. `pnpm install` first.

## UI only (mock data)

```sh
cp .env.example .env
pnpm --filter web dev        # http://localhost:5173
```

With `VITE_USE_MOCK="true"` (the default) the web app runs on built-in sample data: no API,
database or Firebase needed. `VITE_UI_PREVIEW=true` also opens every screen without signing in.

## Full stack on your machine (no cloud accounts)

Needs Docker (or Colima), the [Supabase CLI](https://supabase.com/docs/guides/cli) and the
[Firebase CLI](https://firebase.google.com/docs/cli) with Java 11+.

```sh
supabase start                                     # Postgres, API, storage on ports 553xx
supabase status -o env                             # copy API_URL and SERVICE_ROLE_KEY
firebase emulators:start --only auth --project demo-reusedo
```

In `.env`:

```sh
VITE_USE_MOCK="false"
VITE_API_URL="http://localhost:4000/api"
VITE_FIREBASE_API_KEY="demo-key"
VITE_FIREBASE_PROJECT_ID="demo-reusedo"
VITE_FIREBASE_AUTH_DOMAIN="demo-reusedo.firebaseapp.com"
VITE_FIREBASE_APP_ID="1:1:web:1"
VITE_FIREBASE_AUTH_EMULATOR="http://127.0.0.1:9099"

PORT=4000
SUPABASE_URL="http://127.0.0.1:55321"
SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY from supabase status>"
FIREBASE_PROJECT_ID="demo-reusedo"
FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
SETTINGS_ENCRYPTION_KEY="<openssl rand -base64 32>"
EMAIL_CODE_PEPPER="any-long-string"
```

Then `pnpm dev`. Sign up in the browser; the 6-digit email code is printed in the API log.
To make yourself an admin:

```sh
docker exec -i supabase_db_REUSEDO psql -U postgres -c \
  "update profiles set admin_role = 'super_admin' where email = 'you@example.com'"
```

`supabase db reset` wipes the local database and re-applies the schema.

## Checks and tests

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter api test     # integration tests; needs `supabase start`
```

CI runs all of these on every push and pull request to `main`/`develop`.

## Deploy

- **Web + admin:** Firebase Hosting (`firebase.json`); security headers are set there.
- **API:** Render (`render.yaml`), runs the compiled build with `pnpm --filter api run start`; health check at `/health`.
- **Database:** `supabase link` to the project, then `supabase db push` applies `supabase/migrations`.
  Keys for Gemini, Steadfast, email etc. can be set in Admin → APIs (stored encrypted) instead of env vars.

## Docs

- [docs/PRD.md](docs/PRD.md): product requirements
- [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md): status, architecture, Flutter plan
- [docs/STUDENT_UX.md](docs/STUDENT_UX.md): UX rules (no rankings, privacy on the map, …)
- [docs/FEATURES.md](docs/FEATURES.md): what shipped, what's next, pre-launch checklist
