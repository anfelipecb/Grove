---
id: "GRO-025"
title: "Free task add on Today — title, domain, frequency, time-of-day"
slug: "free-task-add-on-today-title-domain-frequency-time-of-day"
status: "done"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "tasks"]
depends_on: []
created_at: "2026-05-13T21:36:05.827Z"
updated_at: "2026-05-13T21:36:05.827Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-task-scheduling-find-time-design.md`

Right now the only way to create tasks in v2 is through the Coach wizard (multi-step flow). Users need to be able to add tasks freely from the Today page — a quick-add sheet that captures title, life domain, frequency, and preferred time of day. This unblocks GRO-027 (Find Time AI) which needs a populated task list to schedule.

The existing `tasks` table (migration 0008) already has all required columns. The new UI writes directly to it via a new `POST /api/v2/tasks` endpoint.

## Acceptance Criteria

- [ ] A "+" FAB (floating action button) is visible on the Today page (both mobile and desktop)
- [ ] Tapping "+" opens a bottom sheet / modal with: title input, domain chip selector (7 domains with colors), frequency toggle (daily / weekly / once), preferred time-of-day toggle (morning / afternoon / evening / flexible)
- [ ] Submitting creates the task and it appears immediately in the Today task list (optimistic update)
- [ ] Task is saved to `public.tasks` with `status = 'active'` and `frequency` as chosen
- [ ] A new `preferred_time` column (`text`, nullable, `check (preferred_time in ('morning','afternoon','evening','flexible'))`) is added to `public.tasks` via migration `0010_tasks_preferred_time.sql`
- [ ] Validation: title required, domain required; shows inline error if missing
- [ ] `pnpm typecheck` passes

## File Map

- Create: `supabase/migrations/0010_tasks_preferred_time.sql` — add `preferred_time` column to `tasks`
- Create: `apps/web/src/app/api/v2/tasks/route.ts` — `POST /api/v2/tasks` creates a new task
- Create: `apps/web/src/components/v2/today/add-task-sheet.tsx` — bottom sheet form
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` — add "+" FAB, wire up sheet, prepend new task on success
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx` — same FAB for desktop left column
- Modify: `apps/web/src/app/(v2)/today/page.tsx` — pass `profileId` to `TodayTabs` so mobile card can call the API

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-025`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-025 <pr-url>`.

## Notes

- Domain chip selector should reuse the color constants from `domain-progress-bars.tsx` / `domain-tag.tsx`.
- Keep the sheet simple — no AI suggestions here, just direct input.
- `preferred_time` defaults to `'flexible'` in the DB but the UI should show all 4 options clearly.
- This is the foundation for GRO-027 (Find Time): once tasks have `preferred_time`, the AI can slot them into the right part of the day.
