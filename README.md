# ReuseDo

ব্যবহৃত জিনিস বিনামূল্যে দিন ও নিন — বাংলাদেশের জন্য চ্যারিটি/গিফট প্ল্যাটফর্ম। / Give and get used things for free.

| | |
|---|---|
| `apps/web` | ওয়েবসাইট (React + Vite + TypeScript) |
| `apps/app` | Flutter অ্যাপ (Android, iOS, web, Windows, macOS, Linux) |
| `supabase/` | ডাটাবেস মাইগ্রেশন + RLS, Edge Functions, টেস্ট |
| `docs/` | PRD, বিল্ড গাইড, ডেপ্লয় গাইড |

**সার্ভার নেই:** সাইন-ইন Firebase, ডেটা Supabase, ওয়েব Firebase Hosting। দেখুন [docs/DEPLOY.md](docs/DEPLOY.md)।

```bash
pnpm install
cp .env.example apps/web/.env.local   # মান বসান; VITE_USE_MOCK=true দিলে নমুনা ডেটায় চলে
pnpm --filter web dev
```

পরীক্ষা: `pnpm turbo typecheck lint` · `sh supabase/tests/run-local.sh` (Postgres লাগে) · `deno test --allow-env --allow-net=none supabase/functions`
