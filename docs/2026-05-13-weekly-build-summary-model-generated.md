# Weekly build summary (model-assisted, ticket-backed)

**Author:** Andres (Grove)  
**Window:** ~May 12–13, 2026 (board `created_at` / `updated_at` are in **UTC**; most scoped **product** tickets show **2026-05-13**). **May 12** was largely **orchestration**: tightening the **board ticket system** so parallel agents **claim into git worktrees** and **close out by removing those worktrees** (and cleaning branches), which does not always bump individual ticket YAML dates the same way feature work does.  
**Theme:** **Less is more** — ship vertical slices behind explicit tickets, merge to `master`, and avoid speculative surface area until the core ADHD + community loop is solid.

This document is **grounded in [`../.board/tickets/`](../.board/tickets/) frontmatter** plus the **current codebase** (including work that may land ahead of checkbox updates on a ticket).

---

## 1. How to read “the last two days”

- **Source of truth:** [`../.board/tickets/`](../.board/tickets/) — each file has `created_at`, `updated_at`, `status`, and scope.  
- **Dense cluster:** A large set of **v2** tickets share **2026-05-13** timestamps (afternoon through late evening UTC), reflecting a coordinated push on the **v2 ADHD redesign** scaffold, **Today**, **Coach**, **Community**, **scheduling / Find Time**, and **marketing**.  
- **If your course “two days” is local time:** map these UTC stamps to your timezone; the *relative* ordering (scaffold → data → tabs → community extension → scheduling → marketing) still holds.

### May 12 — board + worktrees (parallel agent workflow)

Work on **May 12** focused on making the **parallel board workflow dependable and automated**, not on a single product ticket ID:

- **Claim → isolated checkout:** `pnpm board:ticket:start` (see [`scripts/board-ticket-start.mjs`](../scripts/board-ticket-start.mjs) and [`scripts/board-lib.mjs`](../scripts/board-lib.mjs)) creates a **dedicated git worktree** under **`.worktrees/<ticket-id>-<slug>`**, checks out the **ticket branch**, and updates ticket frontmatter (`doing`, `branch`, `worktree`) so agents do not collide on the main working tree.
- **Merge → cleanup:** `pnpm board:ticket:close` (see [`scripts/board-ticket-close.mjs`](../scripts/board-ticket-close.mjs)) moves the ticket to **done**, **removes the worktree directory**, and **deletes the local ticket branch** after merge, so stale worktrees do not accumulate across terminals.
- **Why it matters:** [`AGENTS.md`](../AGENTS.md) already described this flow; the scripts **encode** it so multiple agents (or humans) can run the same **claim / review / close** loop without manual `git worktree` bookkeeping. **`pnpm board:ticket:review`** records the PR URL and shifts status to **`in_review`**, keeping board state aligned with GitHub.

---

## 2. Ticket inventory (May 13 UTC cluster, `done` unless noted)

Grouped by product area. Titles are from the board; IDs are for cross-reference in GitHub / PRs.

### v2 foundation

| ID | Title (abbrev.) | Notes |
|----|------------------|--------|
| **GRO-015** | v2 branch scaffold and 3-tab nav | Shell for **Today · Coach · Community** per v2 spec. |
| **GRO-016** | v2 DB migration — tasks, completions, scheduled tasks, domain points | Data layer for v2 task loop and points. |

### Today (solo loop)

| ID | Title (abbrev.) | Notes |
|----|------------------|--------|
| **GRO-017** | Today — daily card, check-off, points | Core daily interaction. |
| **GRO-018** | Today — calendar tab, accomplishment log, plan tomorrow | Spec-aligned short-horizon planning. |
| **GRO-022** | Today — responsive desktop 3-column layout | Desktop **Today + log + right rail** layout. |
| **GRO-025** | Free task add on Today — title, domain, frequency, time-of-day | Quick-add path to `tasks` + API. |
| **GRO-028** | Drag-and-drop Today / Tomorrow task list | Reordering UX (e.g. `@dnd-kit`). |

### Coach (design + progression)

| ID | Title (abbrev.) | Notes |
|----|------------------|--------|
| **GRO-019** | Coach — adaptive onboarding wizard with AI goal design | v2 Coach wizard trajectory. |
| **GRO-020** | Coach — domain levels, profile, rewards shop | Domain progression + rewards surface. |

### Community (v2)

| ID | Title (abbrev.) | Notes |
|----|------------------|--------|
| **GRO-021** | Community — shared goals, sessions, member activity | First **v2 `/community`** home experience. |
| **GRO-029** | v2 Community entry — create, join, empty states | Join-by-slug + create from v2 without forcing v1 `/communities`. |
| **GRO-030** | Post-membership alignment — goals ↔ community | One-shot modal + tasks tied to shared goals; RLS for reading public shared goals. |
| **GRO-031** | Shared API — workload balance + social nudges | `POST` coach/community balance contract for AI + fallbacks. |
| **GRO-032** | Today + Coach — community pulse (consumes balance API) | Shared **CommunityPulseCard** + add-task prefill path. |

### Scheduling & “Find Time”

| ID | Title (abbrev.) | Notes |
|----|------------------|--------|
| **GRO-026** | Schedule profile + per-task time preference | `schedule_profile` + `preferred_time` on tasks (supports realistic scheduling). |
| **GRO-027** | Find Time AI — weekly schedule from profile + goals | **`POST /api/ai/find-time`**, `find-time-panel`, Groq plan → `scheduled_tasks`. |

### Marketing & polish

| ID | Title (abbrev.) | Notes |
|----|------------------|--------|
| **GRO-023** | v2 UX clarity — seniority header, Today empty CTA, profile | Small clarity passes on v2 surfaces. |
| **GRO-024** | Landing home rewrite for clearer product story | Marketing / story (see board `pr_url` where recorded). |

### Follow-up engineering (not always a separate ticket line)

- **Post-create `/community` navigation & cache:** `revalidatePath("/community")`, `force-dynamic` + `noStore` on the v2 community page, and **hard navigation** after join/create so the **community board** reliably replaces the entry form.  
- **Playwright:** manual headed spec for Clerk + create → board (`apps/web/e2e/community-manual.spec.ts`) for repeatable verification.  
- **Supabase:** confirmation / application of **public shared goals** read policy for members (migration aligned with repo `0013` / remote `goals_select_public_shared` naming).

---

## 3. Google Calendar integration (parallel track)

This is **in the repo** and ties directly to **scheduling truth** and **GRO-027 Find Time** quality—not a vague future item.

### OAuth & storage

- **Start OAuth:** [`apps/web/src/app/api/auth/google/route.ts`](apps/web/src/app/api/auth/google/route.ts) — redirects to Google with **readonly** scopes:
  - `calendar.readonly`
  - `calendar.events.readonly`  
  Uses `access_type=offline` and `prompt=consent` so refresh tokens are obtainable.
- **Callback:** [`apps/web/src/app/api/auth/google/callback/route.ts`](apps/web/src/app/api/auth/google/callback/route.ts) — exchanges code for tokens and persists **`google_calendar_token`** on the user’s **profile** (JSON payload), then redirects to **`/profile?connected=google`**.

### Client surface

- **Profile UI:** [`apps/web/src/components/v2/profile/google-calendar-connect.tsx`](apps/web/src/components/v2/profile/google-calendar-connect.tsx) — “Connect Google Calendar” CTA to `/api/auth/google`, success messaging when `connected=google` is in the query string.  
- **Profile page** loads `google_calendar_token` and passes `connected` into that component: [`apps/web/src/app/(v2)/profile/page.tsx`](apps/web/src/app/(v2)/profile/page.tsx).

### Calendar reads + Find Time

- **Library:** [`apps/web/src/lib/google-calendar.ts`](apps/web/src/lib/google-calendar.ts) — **token refresh**, **`fetchCalendarEvents`** against Calendar API `primary` for a time window, helpers to derive **busy blocks**.  
- **Find Time route:** [`apps/web/src/app/api/ai/find-time/route.ts`](apps/web/src/app/api/ai/find-time/route.ts) — when **`google_calendar_token`** is present, pulls **real busy intervals** so the weekly plan respects external commitments; when absent, the prompt reflects that explicitly.

### Env you need locally / in Vercel

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`  
- `NEXT_PUBLIC_APP_URL` must match the OAuth redirect origin (e.g. `http://localhost:3000` for local callback).

---

## 4. “Less is more” — what that meant in practice

- **Ticket-sized vertical slices** instead of one mega-PR: each slice had a **narrow file map** (Today vs Coach vs Community vs API).  
- **Reuse over rewrite:** community **create** reuses existing `POST /api/communities`; v2 adds **join** + **alignment** + **pulse** layers.  
- **Explicit contracts:** balance API returns **structured JSON** for UI, not open-ended chat.  
- **Safety and ops:** crisis-style guards on model inputs where applicable; **Supabase MCP / SQL** used to verify remote migration state when closing tickets.

---

## 5. Next steps (your stated direction)

### LangGraph-style orchestration

Move from **scattered route handlers** toward a **multi-step graph**:

- **Nodes:** load context (profile, tasks, memberships, calendar busy blocks) → policy / safety → model or static branch → **Zod** validation → persist or respond.  
- **Edges:** branch on “calendar connected,” “no community,” “Groq missing,” “regenerate,” etc.  
- **Invocation:** same graph **entrypoints** for Today nudge, Coach check-in, Community pulse, and Find Time—**one orchestrator**, multiple **surfaces**.

That sets you up for **tool calls**, **tracing**, and **agent invoke** without duplicating orchestration logic across `route.ts` files.

### Google Calendar

- Harden **token rotation** edge cases (revoked consent, partial token JSON).  
- Optional: **incremental sync** / webhooks later; for v1 of the thesis, **read-only + Find Time** is already high leverage.

---

## 6. Citation block for submissions

- **Board:** [`../.board/tickets/`](../.board/tickets/) — especially **GRO-015 … GRO-032** dated **2026-05-13** (and related merges).  
- **Parallel agent automation (May 12):** [`../scripts/board-lib.mjs`](../scripts/board-lib.mjs), [`../scripts/board-ticket-start.mjs`](../scripts/board-ticket-start.mjs), [`../scripts/board-ticket-review.mjs`](../scripts/board-ticket-review.mjs), [`../scripts/board-ticket-close.mjs`](../scripts/board-ticket-close.mjs), [`../AGENTS.md`](../AGENTS.md).  
- **Specs:** `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`, `docs/superpowers/specs/2026-05-13-task-scheduling-find-time-design.md`.  
- **Code highlights:** `apps/web/src/app/(v2)/`, `apps/web/src/components/v2/`, `apps/web/src/app/api/v2/`, `apps/web/src/app/api/ai/find-time`, `apps/web/src/app/api/auth/google/`, `apps/web/src/lib/google-calendar.ts`, `supabase/migrations/`.  
- **Quality bar:** `pnpm typecheck`, gate scripts, manual Playwright headed flow where Clerk is required.

---

*Drafted with model assistance; tighten names, course IDs, or dates to match your rubric.*
