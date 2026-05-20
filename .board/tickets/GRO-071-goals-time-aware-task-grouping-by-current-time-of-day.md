---
id: "GRO-071"
title: "Goals — time-aware task grouping by current time of day"
slug: "goals-time-aware-task-grouping-by-current-time-of-day"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-071-goals-time-aware-task-grouping-by-current-time-of-day"
worktree: ".worktrees/gro-071-goals-time-aware-task-grouping-by-current-time-of-day"
pr_url: "https://github.com/anfelipecb/Grove/pull/57"
labels: []
depends_on: []
created_at: "2026-05-20T17:00:00.000Z"
updated_at: "2026-05-20T18:31:57.003Z"
---

## Context

Tasks have `preferred_time: "morning" | "afternoon" | "evening" | "flexible"` but the Goals page renders them in a flat list regardless of the current hour. A "morning" task (5–12h) shows identically at 7am and 3pm. Users can't tell which tasks are relevant right now.

## Acceptance Criteria

- [ ] `goal-card.tsx` determines current time window client-side via `new Date().getHours()`:
  - morning = hours 5–11
  - afternoon = hours 12–16
  - evening = hours 17–23
- [ ] Task list in each goal card grouped into sections:
  - **"Good time now"** — tasks whose `preferred_time` matches current window (green dot indicator)
  - **"Coming up"** — tasks in a future window today
  - **"Window passed today"** — tasks in a past window (muted opacity 60%, small "passed" pill)
  - **"Any time"** — `preferred_time === "flexible"` tasks (no special styling)
- [ ] Sections only rendered if they have at least one task (no empty section headers)
- [ ] Already-completed tasks are not regrouped (they show their completed state as-is)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/goals/goal-card.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-071`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-071 <pr-url>`

## Notes

- `preferred_time` is already in the `GoalTask` type on `goal-card.tsx`
- This is a pure client-side render change — no DB queries needed
- Use a `useMemo` or inline function to compute the grouping from the task list and current hour
- "Good time now" section header: `text-xs font-semibold text-moss uppercase tracking-wide` + a `●` dot
