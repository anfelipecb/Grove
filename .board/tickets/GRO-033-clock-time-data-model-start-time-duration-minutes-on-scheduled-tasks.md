---
id: "GRO-033"
title: "Clock-time data model — start_time + duration_minutes on scheduled_tasks"
slug: "clock-time-data-model-start-time-duration-minutes-on-scheduled-tasks"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "db", "scheduling"]
depends_on: []
created_at: "2026-05-13T22:55:00.000Z"
updated_at: "2026-05-13T22:55:00.000Z"
---

## Context

Spec + full implementation plan: `docs/superpowers/plans/2026-05-13-time-aware-scheduling.md`

`scheduled_tasks` currently stores which day a task is planned for (`scheduled_date`) but not what time. Without clock times, we cannot render a time-block calendar view or let the Find Time AI assign real slots. This is the foundation ticket — everything else (GRO-034, GRO-035, GRO-036) depends on it.

## Acceptance Criteria

- [ ] Migration `0015_scheduled_tasks_clock_time.sql` adds `start_time text` (nullable, regex-validated `HH:MM`) and `duration_minutes integer not null default 30` to `scheduled_tasks`
- [ ] `POST /api/v2/calendar/schedule` accepts and stores `start_time` and `duration_minutes`
- [ ] `PATCH /api/v2/calendar/schedule` added — updates `start_time`, `duration_minutes`, or `scheduled_date` on an existing row (for drag-to-reschedule, GRO-035)
- [ ] `GET /api/v2/calendar/[date]` returns `start_time` and `duration_minutes` on each scheduled entry
- [ ] `pnpm typecheck` passes

## File Map

- Create: `supabase/migrations/0015_scheduled_tasks_clock_time.sql`
- Modify: `apps/web/src/app/api/v2/calendar/schedule/route.ts` — POST accepts new fields, add PATCH handler
- Modify: `apps/web/src/app/api/v2/calendar/[date]/route.ts` — SELECT includes new fields, response includes `start_time` + `duration_minutes`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-033`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-033 <pr-url>`

## Notes

- Apply migration via Supabase MCP (`mcp__supabase__apply_migration`, project `rgiysvoemvznmfvvohzy`)
- `start_time` is nullable — existing rows keep `null` meaning "unscheduled within the day"
- The regex constraint `^([01]\d|2[0-3]):[0-5]\d$` enforces valid "HH:MM" format at DB level
