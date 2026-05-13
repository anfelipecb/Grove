# Grove

Grove is an ADHD-aware AI accountability and community coordination platform. Personal follow-through and community participation reinforce each other — the app is built around both loops, not just solo productivity.

The community-building agent is **Mycelium**. Seniority tiers (Seed → Sprout → Rooted → Steward → Elder) replace classic level numbers.

Live at: **https://grove-azure-three.vercel.app**

---

## Monorepo Structure

```
apps/
  web/         Next.js 15 (App Router) — the main product
  worker/      Background jobs (Railway)
packages/
  core/        Shared types, scoring, life domains, AI helpers
supabase/
  migrations/  14 migrations (0001–0014), Postgres + RLS
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS, @dnd-kit |
| Auth | Clerk (native Supabase third-party auth integration) |
| Database | Supabase (Postgres + Row Level Security) |
| AI | Groq — `llama-3.1-8b-instant` |
| Deployment | Vercel (web), Railway (worker) |

---

## Key Routes

| Path | Description |
|---|---|
| `/` | Landing page; signed-in users redirect to `/today` |
| `/sign-in`, `/sign-up` | Clerk hosted auth |
| `/onboarding` | 5-step wizard: name → goals → friction → domain weights → community |
| `/today` | Main dashboard: 3-column desktop / 2-tab mobile. Task list (drag-and-drop), Add Task FAB, Today's Log, Plan Tomorrow, Find Time AI, Domain Progress, Coach Nudge, Community Pulse, Next Unlocks |
| `/coach` | Domain levels, rewards shop, goal wizard |
| `/community` | Join/create community, shared goals, member activity, sessions |
| `/profile` | Display name, sleep schedule, Google Calendar OAuth, progression tier + rewards |

v1 routes (`/dashboard`, `/calendar`, `/communities`, `/mycelium`) redirect to their v2 equivalents.

---

## Local Setup

```bash
# 1. Install dependencies from the repo root
pnpm install

# 2. Copy env file into the web app
cp .env.example apps/web/.env.local
# then fill in the required values (see below)

# 3. Start the dev server
cd apps/web
pnpm dev
```

The app runs without vendor keys for static UI and `pnpm build`. Clerk + Supabase keys are required for sign-in, middleware gating, and live data.

---

## Environment Variables

Place these in `apps/web/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Groq (AI features)
GROQ_API_KEY=

# Google Calendar OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Canonical URL (optional, used for OAuth redirect construction)
NEXT_PUBLIC_APP_URL=
```

Supabase project ID: `rgiysvoemvznmfvvohzy`

---

## Auth and Database

- Use Supabase's **native Clerk third-party auth integration**. In Clerk, activate the Supabase integration; in Supabase, add Clerk under Authentication > Third-party Auth.
- Pass Clerk's session token to Supabase via the `accessToken` client option. Do **not** use the deprecated Clerk JWT template flow.
- RLS policies read Clerk session claims via `auth.jwt()`. Grove stores Clerk user IDs in `profiles.clerk_user_id`; do not reference `auth.users` for Clerk users.

---

## Deployment

- **Web:** Vercel project `grove-growth-together`. Production branch is `master` (not `main`). Deploy with `vercel --prod` from the monorepo root so the `Root Directory: apps/web` setting is not doubled.
- **Worker:** Railway.
- CI (`.github/workflows/ci.yml`) runs `pnpm gate:ci` on every push; it does not invoke `vercel deploy`.

---

## Scripts

```bash
pnpm dev        # start the web app (run from apps/web/)
pnpm worker     # run the worker locally
pnpm typecheck  # type-check all packages
pnpm build      # build all packages
pnpm gate:ci    # lint + typecheck + build (CI gate)
```

---

## Local-Only Directories

`docs/` and `research/` are gitignored. Keep class deliverables, proposal iterations, downloaded papers, and private research notes there.
