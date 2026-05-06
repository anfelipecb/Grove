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
| `/dashboard` | Goals, XP, profile summary; requires auth + `onboarding_step >= 5`. Includes a reassessment CTA that reopens `/onboarding?mode=assess` for calibration rather than a fresh signup. |
| `/calendar` | Month and agenda views for personal goal times (`due_at`) and community sessions (`starts_at`); dedicated planning surface (not the main dashboard). Requires auth + onboarding complete. |
| `/communities` | Community list, feed, sessions, Mycelium side chat. |
| `/mycelium` | Legacy Mycelium workbench (session summary tooling). |

**Onboarding:** `profiles.onboarding_step` is `0–5`. `5` means completed; middleware sends incomplete users to `/onboarding` when they hit `/dashboard`, `/calendar`, `/communities`, or `/mycelium`.
**Assessment mode:** `/onboarding?mode=assess` is for recalibration. Preserve the current user row and avoid duplicate memberships/goal inserts when saving this mode; use Mycelium chat when the user needs help refining goals.

## API routes (`apps/web/src/app/api`)

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/ai/profile` | Intake → `MemberProfileCard` (Groq or local). |
| `POST` | `/api/ai/domain-weights` | Suggested life-domain weights from goals/friction. |
| `POST` | `/api/ai/mycelium-chat` | Coach chat with goals + community commitments context. |
| `POST` | `/api/ai/coach-greeting` | Short dashboard greeting + progress insight from profile/goals/XP (Groq or static/demo fallbacks). |
| `POST` | `/api/ai/coach-suggestions` | 1–3 suggested next tasks with life domains (Groq or static/demo fallbacks). |
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

## Parallel Board Workflow

- `.board/tickets/*.md` is the shared ticket system for parallel agent work. Treat those markdown files as the source of truth.
- **Orchestrator — sync after every ticket:** As soon as you create or materially update a ticket under `.board/tickets/`, **commit and push to the trunk branch** (`master` in this repo) **before** agents in worktrees start work. Uncommitted tickets are invisible to other checkouts and cause “ticket file not in this worktree” errors. In each worktree, run `git fetch` and merge/rebase `master` before claiming.
- Ticket statuses are `backlog`, `ready`, `doing`, `in_review`, `blocked`, and `done`.
- **Status lifecycle (expected flow):** `backlog` → `ready` (scoped, unblocked) → `doing` (claimed) → **`in_review` (PR open, awaiting merge)** → `done`. Skipping `in_review` on the board (e.g. jumping straight from `doing` to `done` after merge) hides work that is waiting on review and makes the board look empty during PRs. Treat `in_review` as mandatory once a PR exists.
- The orchestrator is responsible for decomposing work so active tickets do not collide. Do not run two tickets in parallel if they touch the same files, module ownership, or migration surface.
- Create tickets with `pnpm board:new "Ticket title"`.
- Use `pnpm board:dev` for the local drag-and-drop board. Moving a card updates the ticket markdown file.
- Initialize the reusable worktrees with `pnpm board:agents:init`. The two agent worktrees live at `../Grove-agent-1` and `../Grove-agent-2`.
- Only tickets in `ready` are claimable. `backlog` means not yet scoped.
- **`blocked`:** Use when the ticket must **not** be claimed until something clears—a dependency ticket merges, a design decision lands, a migration order is fixed, or two tickets would edit the same hot files. It is normal for `blocked` to be **empty most of the time**; do not use it for "paused" or low priority. When unblocked, move back to `ready` (or `doing` if re-claiming the same owner) and clear or document why in ticket Notes if useful.
- Claim a ticket from the queue with `pnpm board:ticket:start GRO-001 agent-1` or `agent-2`. That is the canonical claim action: it checks out `ticket/<id>-<slug>` in the selected worktree and updates the ticket metadata.
- Agents do not automatically discover the correct worktree from the board. The orchestrator must launch each agent with its working directory set to the claimed worktree path.
- Before claiming a ticket, read the current `doing` and `in_review` tickets and confirm the write scope does not overlap. If it overlaps, leave the ticket in `ready` or move it to `blocked` until the dependency clears.
- A claimed ticket must have exactly one owner, one worktree, and one active branch. Do not manually assign the same ticket to both agents.
- Keep at most one active ticket per agent in **`doing`**. A ticket in **`in_review`** is still that agent’s responsibility until merge; it should not sit in `doing` while the PR is open. The orchestrator may treat `doing` + `in_review` together when checking WIP limits (e.g. one implementation in flight per agent).
- **After the PR is open:** whoever opened it (implementing agent or orchestrator) must **immediately** set `status: "in_review"` and fill `pr_url` on the ticket markdown, then **commit and push to `master`** so `pnpm board:dev` and other worktrees show the card in review. Do not leave a live PR while the ticket still says `doing`.
- Move a ticket to `done` only after merge to `master` (or explicit PR closure without merge). Optionally add merge commit hash or note in Notes if helpful; `pr_url` stays for history.
- If a claimed ticket is returned to the queue, clear its owner, branch, and worktree fields before treating it as claimable again.
- After a merged ticket, run `pnpm board:agent:reset agent-1` or `agent-2` to return the reusable worktree to its parking branch. The reset deletes the local ticket branch only when it is already merged into `master`.
- When opening a PR from a worktree, include the ticket ID in the branch name and PR title so board state, branch state, and review state stay aligned.

## Supabase + Clerk

- Use Supabase's native third-party auth integration for Clerk.
- Do not use the deprecated Clerk JWT template flow.
- Do not share the Supabase JWT secret with Clerk.
- Supabase client requests should pass Clerk's normal session token through the `accessToken` client option.
- RLS policies should read Clerk session claims with `auth.jwt()`. Grove stores Clerk user IDs in `profiles.clerk_user_id`; do not reference `auth.users` for Clerk users.

## Database migrations (`supabase/migrations`)

Notable columns on `profiles`: `onboarding_step` (0–5), `xp_domain_weights` (JSON). Default community slug `grove-welcome` is seeded for new memberships from onboarding. `xp_events` has an INSERT policy for the owning profile so completing goals can log XP from the client.
