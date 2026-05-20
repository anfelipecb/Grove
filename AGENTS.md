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
- **Production deploy on `master`:** Link the GitHub repo to the Vercel project so pushes to **`master`** trigger production builds (this repo’s default branch is `master`, not `main`). From a linked checkout: `vercel git connect https://github.com/<org>/<repo>` (confirm the prompt). Project **`grove-growth-together`** should show **Production Branch: `master`** in the Vercel dashboard. CI (`.github/workflows/ci.yml`) runs **`pnpm gate:ci`** only; it does not call `vercel deploy`, so you do not need Vercel tokens in GitHub unless you add a separate deploy workflow.
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
- **Typical loop (orchestrator vs agent):** The **orchestrator** scopes tickets (for example `backlog` → `ready`), **commits and pushes** so other machines and terminals see them. **Implementing agents** use a **new terminal session** on the **main checkout**: **sync `master` first** (`git pull` or equivalent) so ticket files and merged dependencies are current, then **claim** with `pnpm board:ticket:start`. They implement **only** in the generated **worktree**, open a **PR into `master`**, and run **`pnpm board:ticket:review`** with the PR URL. The **orchestrator** **reviews and merges** on GitHub, **pulls `master`** in the main checkout, then runs **`pnpm board:ticket:close`** so the ticket is `done`, the worktree is removed, and the local ticket branch is deleted.
- **Orchestrator — sync after every ticket:** As soon as you create or materially update a ticket under `.board/tickets/`, **commit and push to the trunk branch** (`master` in this repo) **before** another terminal claims it. Uncommitted tickets are invisible to other checkouts and cause board drift across parallel terminals.
- Ticket statuses are `backlog`, `ready`, `doing`, `in_review`, `blocked`, and `done`.
- **Status lifecycle (expected flow):** `backlog` → `ready` (scoped, unblocked) → `doing` (claimed) → **`in_review` (PR open, awaiting merge)** → `done`. Skipping `in_review` on the board (e.g. jumping straight from `doing` to `done` after merge) hides work that is waiting on review and makes the board look empty during PRs. Treat `in_review` as mandatory once a PR exists.
- The orchestrator is responsible for decomposing work so active tickets do not collide. Do not run two tickets in parallel if they touch the same files, module ownership, or migration surface.
- Create tickets with `pnpm board:new "Ticket title"`.
- Use `pnpm board:dev` for the local drag-and-drop board. Moving a card updates the ticket markdown file.
- Ticket worktrees are ephemeral and repo-local under `.worktrees/`. They are ignored by git and should be deleted after merge.
- Only tickets in `ready` are claimable. `backlog` means not yet scoped.
- **`blocked`:** Use when the ticket must **not** be claimed until something clears—a dependency ticket merges, a design decision lands, a migration order is fixed, or two tickets would edit the same hot files. It is normal for `blocked` to be **empty most of the time**; do not use it for "paused" or low priority. When unblocked, move back to `ready` (or `doing` if re-claiming the same owner) and clear or document why in ticket Notes if useful.
- **Implementing agent flow:** open a fresh terminal, read `AGENTS.md` plus the ticket, then claim it from the main checkout with `pnpm board:ticket:start GRO-001 [owner]`. That is the canonical claim action: it creates `.worktrees/<ticket-id>-<slug>`, checks out `ticket/<id>-<slug>`, and updates the ticket metadata to `doing`.
- After claiming, `cd` into the printed worktree path and do all implementation there. Do not implement ticket work from the main checkout.
- Before claiming a ticket, read the current `doing` and `in_review` tickets and confirm the write scope does not overlap. If it overlaps, leave the ticket in `ready` or move it to `blocked` until the dependency clears.
- A claimed ticket must have exactly one active branch and one active worktree. Do not manually assign the same ticket to two terminals.
- Keep at most one active `doing` or `in_review` ticket per terminal/agent session.
- **After the PR is open:** the implementing agent must **immediately** run `pnpm board:ticket:review GRO-001 https://github.com/<org>/<repo>/pull/<n>` so the ticket moves to `in_review` and records the PR URL. Do not leave a live PR while the ticket still says `doing`.
- Move a ticket to `done` only after merge to `master` (or explicit PR closure without merge). Optionally add merge commit hash or note in Notes if helpful; `pr_url` stays for history.
- If a claimed ticket is returned to the queue, clear its owner, branch, and worktree fields before treating it as claimable again.
- **Orchestrator close-out:** after the PR is merged and the main checkout is updated to `master`, run `pnpm board:ticket:close GRO-001`. This marks the ticket `done`, removes the linked worktree, and deletes the merged local branch.
- **Squash merges on GitHub:** A squash-merged PR does not make the feature branch show up in `git branch --merged master`. `board:ticket:close` still works when the ticket has **`pr_url`** (from `board:ticket:review`) and the **`gh` CLI** can confirm the PR is **MERGED**—install `gh` and authenticate on machines that run close-out.
- **Stacked PRs:** Open follow-on work as a PR **into `master`** once its dependency has landed (or retarget/rebase onto `master` after the base PR merges). PRs opened into another **ticket branch** drift from trunk after squash merges.
- When opening a PR from a worktree, include the ticket ID in the branch name and PR title so board state, branch state, and review state stay aligned.

## UX Review Checklist (UI tickets)

Before opening a PR on any ticket that touches the landing, Today, Coach, or Community surfaces, verify each point:

1. **Copy count:** Did you add text strings that are not user data (task titles, names, dates)? If yes, justify each one — default is to remove, not add.
2. **Task primacy on Today:** Is the task list still the visually heaviest element? If your eye goes to a widget before the task list, the hierarchy is wrong.
3. **Progressive disclosure:** Are lists, reasons, or explanatory paragraphs showing by default that could be behind an expand / "Why?" link? Move them unless they are the user's primary next action.
4. **CTA count:** More than one filled/primary button per column or region? Demote the secondary one to a text link or ghost button.
5. **Landing H1 rule:** If you touch `landing-experience.tsx`, confirm exactly one primary benefit statement above the fold and one subhead. No second headline-tier block.

## Supabase + Clerk

- Use Supabase's native third-party auth integration for Clerk.
- Do not use the deprecated Clerk JWT template flow.
- Do not share the Supabase JWT secret with Clerk.
- Supabase client requests should pass Clerk's normal session token through the `accessToken` client option.
- RLS policies should read Clerk session claims with `auth.jwt()`. Grove stores Clerk user IDs in `profiles.clerk_user_id`; do not reference `auth.users` for Clerk users.

## Database migrations (`supabase/migrations`)

Notable columns on `profiles`: `onboarding_step` (0–5), `xp_domain_weights` (JSON). Default community slug `grove-welcome` is seeded for new memberships from onboarding. `xp_events` has an INSERT policy for the owning profile so completing goals can log XP from the client. **Community creation** in production requires migration `0005_communities_create_and_manage.sql` applied on the linked Supabase project (`created_by` + insert RLS). **If creating a community returns** `"infinite recursion detected in policy for relation \"memberships\""`, apply **`0006_memberships_select_policy_no_recursion.sql`** (replaces self-referential memberships `SELECT` policy with a `SECURITY DEFINER` helper).
