# Grove Agent Memory

## Product Intent

Grove is an ADHD-aware AI accountability and community coordination platform. The core thesis is that personal follow-through and community participation reinforce each other. The app should not become generic solo productivity software with a community tab; community participation is a first-class part of the growth loop.

## Names

- Product/repo: Grove
- Community-building agent: Mycelium
- Progression language: Seniority tiers, not classic RPG levels

## V1 Priorities

1. Personal loop: onboarding, profile, goals, friction-aware XP, rewards, and nudges.
2. Community loop: communities, sessions, notes, summaries, commitments, feed, and participation XP.
3. Mycelium: session memory, commitment extraction, participation nudges, and newcomer context.

## Routes (web `apps/web`)

| Path | Purpose |
|------|---------|
| `/` | Marketing landing; signed-in users redirect to `/dashboard`. |
| `/sign-in`, `/sign-up` | Clerk hosted auth. |
| `/onboarding` | Five-step wizard (intake → domain weights → save). Requires auth. |
| `/dashboard` | Goals, XP, profile summary; requires auth + `onboarding_step >= 5`. |
| `/communities` | Community list, feed, sessions, Mycelium side chat. |
| `/mycelium` | Legacy Mycelium workbench (session summary tooling). |

**Onboarding:** `profiles.onboarding_step` is `0–5`. `5` means completed; middleware sends incomplete users to `/onboarding` when they hit `/dashboard`, `/communities`, or `/mycelium`.

## API routes (`apps/web/src/app/api`)

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/ai/profile` | Intake → `MemberProfileCard` (Groq or local). |
| `POST` | `/api/ai/domain-weights` | Suggested life-domain weights from goals/friction. |
| `POST` | `/api/ai/mycelium-chat` | Coach chat with goals + community commitments context. |
| `POST` | `/api/ai/session-summary` | Session notes → structured summary. |
| `POST` | `/api/onboarding/save` | Upsert profile, onboarding row, goals, join `grove-welcome` (user JWT + RLS first; service role optional fallback). |
| `POST` | `/api/xp` | XP suggestion (core helper). |

## Auth and local build

- Production and Vercel: set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. When both are set, `middleware.ts` enforces auth and onboarding gating.
- Local/CI without Clerk: omit those vars; middleware becomes a no-op and layouts skip `ClerkProvider`, so `pnpm build` can run without secrets. Runtime auth features need real keys.

## Deployment

- **Web:** Vercel. Project name: **`grove-growth-together`**. Production may be aliased (e.g. `grove-azure-three.vercel.app`); run **`vercel --prod` from the monorepo root** so `Root Directory: apps/web` is not doubled.
- Set `NEXT_PUBLIC_APP_URL` in Vercel to the canonical site URL (e.g. `https://grove-azure-three.vercel.app`).
- **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are required** for sign-in/up, middleware, and server `auth()`. Without them the landing page loads but the dashboard shows a setup message and `/sign-up` explains missing Clerk.
- **Worker/jobs:** Railway
- **Database/auth/storage:** Supabase + Clerk
- **AI:** OpenAI-compatible Groq first, with provider abstraction for later swaps.

## Privacy And Safety

- ADHD/focus disclosure is optional and private by default.
- Public support preferences must be opt-in.
- AI is a coach/coordinator, not a therapist or clinical provider.
- Do not generate diagnosis claims.
- Add escalation copy for crisis/self-harm content instead of trying to handle it conversationally.

## Scoring

XP should value effort, resistance, importance, urgency, and community contribution. AI can suggest XP, but users confirm or adjust it. Use broad domains with editable subareas:

- Wellbeing
- Learning
- Work/Build
- Relationships
- Community
- Life Admin
- Rest/Play

## Repo Rules

- `docs/` is local-only for class deliverables and proposal iterations.
- `research/` is local-only for downloaded papers and notes.
- Do not commit `.env*`, vendor secrets, downloaded source PDFs, or class documents.
- Commit regularly at meaningful checkpoints.

## Supabase + Clerk

- Use Supabase's native third-party auth integration for Clerk.
- Do not use the deprecated Clerk JWT template flow.
- Do not share the Supabase JWT secret with Clerk.
- Supabase client requests should pass Clerk's normal session token through the `accessToken` client option.
- RLS policies should read Clerk session claims with `auth.jwt()`. Grove stores Clerk user IDs in `profiles.clerk_user_id`; do not reference `auth.users` for Clerk users.

## Database migrations (`supabase/migrations`)

Notable columns on `profiles`: `onboarding_step` (0–5), `xp_domain_weights` (JSON). Default community slug `grove-welcome` is seeded for new memberships from onboarding. `xp_events` has an INSERT policy for the owning profile so completing goals can log XP from the client.
