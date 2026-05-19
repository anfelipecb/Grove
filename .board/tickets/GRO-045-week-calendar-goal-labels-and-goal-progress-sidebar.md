---
id: "GRO-045"
title: "Week calendar goal labels and goal progress sidebar"
slug: "week-calendar-goal-labels-and-goal-progress-sidebar"
status: "ready"
priority: "p3"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "calendar", "goals"]
depends_on: ["GRO-039"]
created_at: "2026-05-19T23:01:23.502Z"
updated_at: "2026-05-19T23:01:23.502Z"
---

## Context

The week calendar (GRO-035, done) shows tasks as domain-colored time blocks but doesn't connect them to their parent goals. This ticket makes the calendar goal-aware: task blocks show the goal title, a progress strip above the grid shows each goal's weekly completion, and users can filter the calendar by goal.

## Acceptance Criteria

- [ ] `GET /api/v2/calendar/[date]` updated — each scheduled task entry now includes `goal_title: string | null` (join with `goals` table)
- [ ] `WeekCalendar` task blocks render `goal_title` in small muted text below the task title (only if not null)
- [ ] Calendar tab adds a "Goal progress this week" collapsible strip above the week grid — each goal as a mini horizontal progress bar (tasks completed / total active tasks this week)
- [ ] Tap a goal in the strip → calendar highlights only that goal's tasks (others at 30% opacity)
- [ ] Tap again or tap elsewhere → clears filter, all tasks full opacity
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/api/v2/calendar/[date]/route.ts` — add `goal_title` to response
- Modify: `apps/web/src/components/v2/today/week-calendar.tsx` — render goal_title on blocks
- Modify: `apps/web/src/components/v2/today/calendar-tab.tsx` — add goals progress strip + filter state

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-045`.
- Work inside the generated `.worktrees/GRO-045-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-045 <pr-url>`.

## Notes

- GRO-039 (Goals view) must be merged first — the goals data patterns and API are established there
- GRO-035 (week calendar) is already done — this modifies the existing component
- Goal progress data: count `task_completions` this week grouped by `goal_id` — same query as GRO-039
