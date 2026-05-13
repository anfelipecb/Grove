---
id: "GRO-018"
title: "Today — calendar tab with accomplishment log and plan-tomorrow"
slug: "today-calendar-tab-with-accomplishment-log-and-plan-tomorrow"
status: "done"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/16"
labels: []
depends_on: []
created_at: "2026-05-13T15:43:41.545Z"
updated_at: "2026-05-13T16:19:25.807Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`
Depends on: GRO-017 merged (today-tabs.tsx stub exists, task_completions table exists).

Tab 2 of `/today`. The calendar is an **accomplishment log first, planner second** — ADHD users forget what they did; seeing it builds motivation. Default view: Today + Tomorrow (day view). Toggle to Week or Month available but not the default. Past days show what was completed. Future days show scheduled tasks (from `scheduled_tasks` table).

## Acceptance Criteria

- [ ] Calendar tab replaces the stub in `today-tabs.tsx`
- [ ] Default view shows today's completed tasks (from `task_completions`) as log entries and tomorrow's scheduled tasks (from `scheduled_tasks`) as planned entries
- [ ] Day toggle (Day | Week | Month) renders across all breakpoints; Day is selected by default
- [ ] Week view shows 7 days; each day cell shows a dot indicator if it has completions
- [ ] Month view shows a mini-grid; days with completions are highlighted by domain color
- [ ] Tapping a past day expands to show that day's `task_completions` as a list (title, domain tag, points earned)
- [ ] "Plan tomorrow" section: lists tasks scheduled for tomorrow; "+ Add task for [date]" opens a picker of active tasks to schedule (inserts into `scheduled_tasks`)
- [ ] Log entries are visually distinct from planned entries (solid vs dashed border)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/today/today-tabs.tsx` — replace Calendar stub with real component
- Create: `apps/web/src/components/v2/today/calendar-tab.tsx` — orchestrates day/week/month views
- Create: `apps/web/src/components/v2/today/day-log.tsx` — single day accomplishment list
- Create: `apps/web/src/components/v2/today/plan-tomorrow.tsx` — schedule picker for next day
- Create: `apps/web/src/app/api/v2/calendar/[date]/route.ts` — GET completions for a date
- Create: `apps/web/src/app/api/v2/calendar/schedule/route.ts` — POST schedule a task for a date

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-018`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-018 <pr-url>`.

## Notes

GRO-022 (desktop 3-col layout) is blocked until GRO-017 + GRO-018 both merge.
