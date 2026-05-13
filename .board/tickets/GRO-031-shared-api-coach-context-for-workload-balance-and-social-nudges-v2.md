---
id: "GRO-031"
title: "Shared API — Coach context for workload balance and social nudges (v2)"
slug: "shared-api-coach-context-for-workload-balance-and-social-nudges-v2"
status: "done"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/commit/ea557b55"
labels:
  - "v2"
  - "community"
  - "coach"
  - "ai"
depends_on:
  - "GRO-016"
  - "GRO-021"
created_at: "2026-05-13T21:44:04.943Z"
updated_at: "2026-05-13T23:45:00.000Z"
---

## Context

[GRO-032](GRO-032-surface-wiring-today-community-pulse-and-coach-check-in-consumes-balance-api.md) needs a **single backend contract** consumed by **Coach** and **Today**. Today’s solo stack lives on `tasks`, `task_completions`, and scheduled rows ([GRO-016](GRO-016-v2-db-migration-tasks-task-completions-scheduled-tasks-domain-points.md)); community context mirrors [`GET /api/v2/community`](apps/web/src/app/api/v2/community/route.ts) (membership, shared goals, upcoming sessions, RSVP hints).

Users asked for help **balancing** what is already on their plate with community commitments and gentle **social time** nudges (sessions RSVP’d, low-friction micro-steps)—without reopening cut scope like AI session summarization.

Reuse patterns from [`apps/web/src/app/api/ai/coach-suggestions/route.ts`](apps/web/src/app/api/ai/coach-suggestions/route.ts): authenticated user, crisis scan on model inputs where free text appears, structured JSON output validated with Zod, Groq when configured + deterministic fallback similar to `staticCoachSuggestions`.

## Scope

- New **`POST`** route under v2 namespace, e.g. [`apps/web/src/app/api/v2/coach/community-balance/route.ts`](apps/web/src/app/api/v2/coach/community-balance/route.ts).
- Server loads for the signed-in profile:
  - Active/relevant personal `tasks` (titles, domains, frequency, `is_community_task`).
  - Primary membership community (same “first membership” ordering as [`community/page.tsx`](apps/web/src/app/(v2)/community/page.tsx)).
  - Shared goals + upcoming sessions + user attendance/RSVP rows needed for “time with others” messaging.
- Response shape (example—finalize in implementation): `{ headline, balanceTips[], socialNudges[], suggestedMicroTasks[] }` where micro-tasks are **structured** suggestions (title, domain, optional `goal_id`, suggested `is_community_task`) sized for Today/Coach widgets—not free-form therapy chat.
- **No** summarization of session notes; stay planning/nudge only.

## Out of scope

Push notifications; modifying Groq models globally; peer messaging.

## Acceptance Criteria

- [x] `POST` endpoint returns **200** with JSON matching a documented Zod schema when Clerk user + Supabase are configured.
- [x] Payload includes at least **one** balance-oriented insight derived from comparing task load vs community signals (deterministic fallback acceptable when Groq absent—similar to coach-suggestions demo path).
- [x] Payload includes at least **one** social/time-with-others nudge when an upcoming session exists within a configurable horizon (e.g. 7 days), informed by RSVP/attendance when available.
- [x] Crisis-style content in optional user-supplied strings triggers safe short-circuit (`containsCrisisSignal` / patterns aligned with existing AI routes).
- [x] Unauthorized requests return **401**; demo mode mirrors patterns used by other v2 coach APIs if applicable.
- [x] `pnpm typecheck` passes.

## File Map

- Create: [`apps/web/src/app/api/v2/coach/community-balance/route.ts`](apps/web/src/app/api/v2/coach/community-balance/route.ts).
- Create or extend helper: [`apps/web/src/lib/v2/community-balance-context.ts`](apps/web/src/lib/v2/community-balance-context.ts) — loads Supabase rows shared with [`apps/web/src/app/api/v2/community/route.ts`](apps/web/src/app/api/v2/community/route.ts) to avoid drift (extract bits from GET handler if cleaner).
- Reference: [`apps/web/src/app/api/ai/coach-suggestions/route.ts`](apps/web/src/app/api/ai/coach-suggestions/route.ts) — Groq + Zod + fallbacks.

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-031`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-031 <pr-url>`.

## Notes

**Depends_on [GRO-025](GRO-025-free-task-add-on-today-title-domain-frequency-time-of-day.md)** so suggested micro-tasks can optionally deep-link into existing task creation UX later ([GRO-032](GRO-032-surface-wiring-today-community-pulse-and-coach-check-in-consumes-balance-api.md)).

**Merged:** [`ea557b55`](https://github.com/anfelipecb/Grove/commit/ea557b55). Demo cookie parity for this route was not required for acceptance; Clerk-authenticated POST only.
