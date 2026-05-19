---
id: "GRO-041"
title: "Onboarding v2 — calendar-aware task scheduling and balance advocate"
slug: "onboarding-v2-calendar-aware-task-scheduling-and-balance-advocate"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "onboarding", "scheduling"]
depends_on: ["GRO-038"]
created_at: "2026-05-19T23:01:22.345Z"
updated_at: "2026-05-19T23:01:22.345Z"
---

## Context

After users define goals (GRO-038), onboarding ends abruptly with a task list but no sense of *when* those tasks fit in the user's week. This ticket adds a scheduling step that uses the existing `computeFreeWindows()` helper to place tasks in real calendar slots and a balance advocate layer that flags sleep gaps and suggests a lunch block.

**New wizard step (after task refinement, before confirmation):**
- "Let's schedule your first week"
- Fetches free windows for next 7 days via `computeFreeWindows()`
- Balance advocate: warns if sleep window < 7h, suggests a 12:00–13:00 lunch block if not in schedule_profile
- Shows a simplified week preview with each task in its first fitting free slot
- User can Accept (tasks get `start_time` + `duration_minutes`) or Skip

## Acceptance Criteria

- [ ] New wizard step added between task refinement and confirmation
- [ ] Calls `computeFreeWindows` from `apps/web/src/lib/free-windows.ts` using the user's `schedule_profile` (defaults if not set)
- [ ] Balance advocate: warns if no sleep gap > 7h; suggests lunch block if not present
- [ ] Week preview shows task titles with proposed time slots
- [ ] "Accept schedule" → calls PATCH `/api/v2/calendar/schedule` for each task to save `start_time` + `duration_minutes`
- [ ] "Skip for now" → proceeds to confirmation step without scheduling
- [ ] `/api/v2/coach/setup` updated to accept optional `scheduledTasks` array (list of task IDs with start_time)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/coach/coach-wizard.tsx` — add schedule step
- Modify: `apps/web/src/app/api/v2/coach/setup/route.ts` — accept optional `scheduledTasks`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-041`.
- Work inside the generated `.worktrees/GRO-041-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-041 <pr-url>`.

## Notes

- GRO-038 must be merged first (the wizard structure will have changed)
- `computeFreeWindows` is at `apps/web/src/lib/free-windows.ts` — already tested in production via coach-suggestions
- PATCH `/api/v2/calendar/schedule` already exists (GRO-033 — done)
- This step is always skippable — never block onboarding completion
