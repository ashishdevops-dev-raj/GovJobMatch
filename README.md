# GovJobMatch

Indian government job search and **eligibility matching** platform. Tell the app your qualification, age, state, category, and preferences; it compares those against **structured criteria** stored for each listing and explains **why a job appears to match, why it does not, and what to verify**.

This is **not** a government website. Eligibility output is an **automated indication**, never an official certificate. Always read the linked official notification before applying.

Stitch-generated screens in `design/` are the visual source of truth. The Next.js app reuses that colour, type, and layout system.

## Features

- Homepage search, popular categories, latest / closing-soon / B.Tech / 12th / technical sections (counts from data, not hardcoded)
- Paginated job search with URL query filters (qualification, branch, state, organisation, category, experience, job type, deadline)
- Job details with official notification and apply links, demo vs verified labels
- Rule-based eligibility engine (qualification, branch, exact age, experience, state, category, extra conditions)
- Multi-step eligibility wizard and explained results (`ELIGIBLE` / `CHECK_DETAILS` / `NOT_ELIGIBLE`)
- Supabase Auth: sign up, login, logout, forgot password
- Profile, saved jobs, application tracker, in-app notifications
- Exam explorer (sample rows with official URLs, expandable)
- Admin dashboard (role-gated): jobs, sources, organisations, users, notifications
- Python collectors per official source, normalisation, fingerprint dedupe, GitHub Actions
- Local demo dataset so the UI works before Supabase is connected

## Architecture

```
app/                 Next.js App Router (UI + API routes)
components/          Stitch-aligned layout, jobs, eligibility, auth
lib/eligibility/     Pure rule engine (also used by tests)
lib/jobs/            Search, pagination, queries
lib/data/demo.ts     Bundled demo catalog (is_sample)
lib/supabase/        Browser, server, admin, middleware clients
supabase/            SQL migrations + seed
scripts/jobs/        Python collectors (no fake government API)
.github/workflows/   Daily + manual collector
design/              Original Stitch HTML (reference only)
```

**Data flow:** Official websites → collector (polite fetch, robots.txt) → normalize → fingerprint dedupe → Supabase `jobs` with `status=pending`, `is_verified=false` → admin verifies/publishes → public site.

If a site cannot be parsed reliably, the collector **does not invent vacancies**. It records a source check for **manual admin entry**.

Without Supabase env vars, the Next.js app serves the bundled demo catalog so you can develop UI and eligibility locally.

## Local setup

Requirements: Node.js 20+, npm, Python 3.12+ (for the collector).

```bash
git clone <your-repo>
cd govjobmatch_eligibility_platform
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Job pages work on demo data immediately.

```bash
npm test
npm run lint
npm run build
```

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Authentication → Providers → Email (enable). Confirm email can be disabled in development.
3. Copy **Project URL** and **anon public** key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy **service_role** key into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (server/collector/GitHub only — never `NEXT_PUBLIC_`).
5. SQL Editor: run `supabase/migrations/0001_init.sql`, then `0002_exams_and_roles.sql`, then `supabase/seed.sql`.
6. Authentication → URL configuration: add `http://localhost:3000/auth/callback` and your Vercel URL.

Promote an admin user after first signup (SQL Editor):

```sql
insert into public.user_roles (user_id, role)
values ('YOUR-AUTH-USER-UUID', 'admin')
on conflict (user_id) do update set role = 'admin';
```

## Environment variables

See `.env.example`. Only variables the app actually uses:

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | RLS-limited anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / Actions / Python | Admin + collector upserts |
| `NEXT_PUBLIC_SITE_URL` | Server | Canonical site for sitemap/robots |
| `SUPABASE_URL` | Optional alias | Same as project URL for the collector |

Never commit `.env.local`. Never put the service role key in client code.

## Database migration

Migrations live in `supabase/migrations/`. They create organisations, sources, jobs (plus search vector and fingerprint), profiles, saved jobs, applications, notifications, eligibility results, exams, user roles, RLS, and `search_jobs()`.

Apply with the SQL editor or the Supabase CLI (`supabase db push`) if you use it — CLI is optional.

## Seed data

`supabase/seed.sql` inserts **demo** organisations, official source URLs, jobs, and exams. Every demo job has `is_sample = true` and “Demo Data” in the UI. Dates are in Oct–Nov 2026 so listings are open relative to 1 Oct 2026. Official apply links point at real organisation websites, not fake portals.

The same catalog is mirrored in `lib/data/demo.ts` for local-only mode.

## Run Next.js

```bash
npm run dev      # http://localhost:3000
npm run build
npm start
```

## Run Python collector

```bash
pip install -r scripts/requirements.txt
python -m scripts.jobs.run --source all --dry-run
python -m scripts.jobs.run --source ssc --json-out tmp/ssc.json
```

With `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` set, omit `--dry-run` to upsert pending jobs.

Collectors **respect robots.txt**, use delays, and skip sites they cannot parse instead of fabricating fields.

## GitHub Actions setup

File: `.github/workflows/fetch-jobs.yml`

- Schedule: daily 02:00 UTC
- Manual: Actions → Fetch jobs → Run workflow

Repository secrets:

1. `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`

Do not store secrets in source.

## Cloudflare deployment

This is a **Next.js App Router** app (SSR, API routes, middleware). Cloudflare cannot treat it as a static site. `next build` writes `.next`, not `dist`, which is why a Pages deploy fails with `Output directory "dist" not found`.

Use **Workers** (OpenNext), not a static Pages output directory.

1. Push this repo (must include `wrangler.jsonc` and `open-next.config.ts`).
2. In Cloudflare: **Workers & Pages → Create → Connect Git** for `GovJobMatch`.
3. Settings:
   - **Build command:** `npm run build` (runs `opennextjs-cloudflare build`)
   - **Do not** set output directory to `dist`
   - **Root directory:** `/` (repo root)
4. Environment variables (same names as `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret, server only)
   - `NEXT_PUBLIC_SITE_URL` = `https://<your-worker>.workers.dev` or your custom domain
5. Deploy. Add that URL to Supabase Auth redirect URLs (`/auth/callback`).

Local Workers preview: `npm run preview`. Direct deploy from your machine: `npm run deploy`.

## Vercel deployment

1. Push the GitHub repo.
2. Import the project on the [Vercel free hobby plan](https://vercel.com).
3. Set the build command to `npm run build:next` (plain `next build`).
4. Set the same env vars as `.env.example` (`SUPABASE_SERVICE_ROLE_KEY` as a **server** env var, not exposed to the browser).
5. Set `NEXT_PUBLIC_SITE_URL` to `https://your-app.vercel.app`.
6. Deploy. Add the production URL to Supabase Auth redirect URLs.

No paid search, scrape, or email SaaS is required.

## Security

- Row Level Security: users read/update only their profile, saved jobs, applications, notifications, and eligibility results.
- Public reads **published + verified** jobs only.
- Admin routes require `user_roles.role = 'admin'` (middleware + API).
- Service role key is used only in server API admin routes and the Python uploader.
- External job HTML is never executed; descriptions are sanitised for display.
- Eligibility is computed on the server (`POST /api/eligibility`); UI badges are indications only.

## Adding a new government source

1. Create `scripts/jobs/sources/your_board.py` implementing `JobSource` (`fetch` / `parse` / `collect`) like `ssc.py`.
2. Register it in `scripts/jobs/sources/__init__.py`.
3. Insert a `job_sources` row (admin UI or SQL) with the **official URL**.
4. Prefer public HTML/RSS. If parse quality is poor, emit an empty job list and a `manual_review` source check.
5. Admin verifies fetched rows (`pending` → `published`, `is_verified = true`) after reading the official PDF/page.

Never add a paid scraping API or a fake “all India jobs” API.

## Eligibility engine

`lib/eligibility/engine.ts` → `checkEligibility(profile, job)`:

- **Qualification:** alias map + levels (B.Tech satisfies graduate; 12th does not satisfy B.Tech-only).
- **Branch:** CSE/IT family vs mechanical-only, etc.
- **Age:** exact calendar age vs cutoff date (`age_relaxation.cutoff_date` or application end). Relaxation years apply **only** if present on that job.
- **Experience / state / category** as structured fields.
- Extra `required_conditions` (GATE, percentage, …) produce **CHECK_DETAILS**, never a silent pass.

Statuses: `ELIGIBLE`, `CHECK_DETAILS`, `NOT_ELIGIBLE`. Failed rules are always shown.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Jobs look like demo | Expected until Supabase is seeded and env vars are set. Look for the **Demo Data** badge. |
| Login form shows setup message | `.env.local` missing public Supabase URL/anon key; restart `npm run dev`. |
| Saved jobs 401 | Sign in. RLS requires `auth.uid()`. |
| Admin redirects home | `user_roles` is not `admin` for that user. |
| Collector uploads 0 jobs | Site blocked by robots.txt or HTML is JS-only — use admin manual entry. |
| Collector upsert fails (`ON CONFLICT`) | Apply all migrations, including `0003_jobs_fingerprint_unique.sql`. PostgREST needs a UNIQUE **constraint** on `jobs.fingerprint`, not only an index. |
| `digest` error in SQL | Enable `pgcrypto` (included in `0001_init.sql`). |
| Build fails on env | Public vars may be empty at build; the app falls back to demo data. |

Original Stitch mockups remain under `design/` and are not served in production.
