---
id: "GRO-026"
title: "Schedule profile + per-task time preference"
slug: "schedule-profile-per-task-time-preference"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "profile", "scheduling"]
depends_on: ["GRO-025"]
created_at: "2026-05-13T21:36:06.131Z"
updated_at: "2026-05-13T21:36:06.131Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-task-scheduling-find-time-design.md`

The "Find Time" AI agent (GRO-027) needs to know the user's available hours before it can suggest a realistic weekly schedule. This ticket captures that data in two places:

1. **Schedule profile** on the Profile page: sleep window (bedtime + wake time), work/school hours, and free-time preference.
2. **Per-task preferred time** is already added by GRO-025 (`preferred_time` column). GRO-026 surfaces it in the task row so users can change it inline.

The schedule profile is stored as `schedule_profile` JSONB on `profiles`. No new table needed.

Shape: `{ bedtime: "22:00", wakeTime: "06:30", workStart: "09:00", workEnd: "17:00", freeTimePreference: "evenings" | "mornings" | "weekends" | "flexible" }`

All fields optional — GRO-027 falls back to sensible defaults (8h sleep, 9-5 work, flexible) when not set.

## Acceptance Criteria

- [ ] Profile page (`/profile`) gains a "My Schedule" section below the name editor
- [ ] Schedule form captures: bedtime hour, wake time, work start/end (or "no fixed schedule"), free-time preference chip (Mornings / Afternoons / Evenings / Weekends / Flexible)
- [ ] Saving POSTs to `PATCH /api/v2/profile` — extend existing endpoint to accept `schedule_profile` field
- [ ] `schedule_profile` stored as nullable JSONB on `profiles` via migration `0011_profiles_schedule_profile.sql`
- [ ] Task rows on Today show `preferred_time` label and have an edit affordance (tap to cycle or small select)
- [ ] `PATCH /api/v2/tasks/:id` endpoint created to update `preferred_time`
- [ ] `pnpm typecheck` passes

## File Map

- Create: `supabase/migrations/0011_profiles_schedule_profile.sql`
- Modify: `apps/web/src/app/api/v2/profile/route.ts` — accept `schedule_profile` in PATCH body
- Create: `apps/web/src/components/v2/profile/schedule-form.tsx` — sleep/work/free-time form (client)
- Modify: `apps/web/src/app/(v2)/profile/page.tsx` — add schedule-form, fetch + pass `schedule_profile`
- Create: `apps/web/src/app/api/v2/tasks/[id]/route.ts` — `PATCH` to update `preferred_time`
- Modify: `apps/web/src/components/v2/today/task-row.tsx` — show + edit `preferred_time`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-026`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-026 <pr-url>`.

## Notes

- Do NOT build Google Calendar OAuth sync here — that is a future integration.
- GRO-025 must be merged first (adds `preferred_time` column to `tasks`).
