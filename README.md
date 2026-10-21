# ReuseDo

Give and get used items for free, with verified people in your area (Bangladesh, Bangla-first).

```
apps/
  web/   React 19 + Vite + Tailwind v4 + TanStack Query + Zustand (PWA, includes /admin)
  api/   Express + Zod + Socket.io → Supabase (Postgres, Storage) + Firebase Auth
docs/    PRD, build guide, UX rules, feature list
```

## Run locally

Requires Node 20+ and pnpm 9.

```sh
pnpm install
cp .env.example .env      # fill in what you need; see below
pnpm dev                  # web on http://localhost:5173, api on $PORT (default 8080)
```

The web app uses **mock data by default**, so you can work on the UI without the API, Firebase or Supabase.
Set `VITE_USE_MOCK=false` once the methods in `apps/web/src/features/data/apiSource.ts` are implemented.
`VITE_UI_PREVIEW=true` (dev only) opens every screen without signing in.

All env vars live in the root `.env` (the web app reads it via `envDir`). `VITE_*` values end up in the
browser bundle; never put server secrets (service-role key, Firebase private key, email/courier keys) behind that prefix.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm build
```

CI runs the same three on every push and pull request to `main`/`develop`.

## Deploy

- **Web + admin:** Firebase Hosting (`firebase.json`, targets `web` and `admin`); security headers are set there.
- **API:** Render (`render.yaml`), runs the compiled build with `pnpm --filter api run start`; health check at `/health`.
- **Database:** SQL migrations in `apps/api/src/database/migrations` and `infrastructure/database/migrations`, applied in Supabase.

## Docs

- [docs/PRD.md](docs/PRD.md): product requirements
- [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md): current status, connecting the API, Flutter plan
- [docs/STUDENT_UX.md](docs/STUDENT_UX.md): UX rules (no rankings, privacy on the map, …)
- [docs/FEATURES.md](docs/FEATURES.md): what shipped, what's next, pre-launch checklist
