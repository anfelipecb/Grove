---
id: "GRO-017"
title: "Today — daily card with task check-off and points"
slug: "today-daily-card-with-task-check-off-and-points"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today"]
depends_on: ["GRO-015", "GRO-016"]
created_at: "2026-05-13T15:43:41.250Z"
updated_at: "2026-05-13T15:43:41.250Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`
Depends on: GRO-015 (v2 routing) + GRO-016 (tasks DB tables) both merged.

The Daily Card is Tab 1 of the `/today` page. It shows today's tasks in two sections: "Required (coach-assigned)" and "Your goals". Each task row has a checkbox, title, domain tag, and point value. Checking it off creates a `task_completions` row and increments `profiles.spendable_points`. The header shows greeting, streak, and total points.

Mobile-first. Desktop enhancement is a separate ticket (GRO-022).

## Acceptance Criteria

- [ ] `/today` page renders a 2-tab layout (Daily Card | Calendar) — Calendar tab is a stub here
- [ ] Daily Card loads today's active `tasks` for the signed-in profile from Supabase
- [ ] Required tasks (`is_required = true`) appear in a separate section above goal tasks
- [ ] Each task row shows: checkbox, title, `#domain` tag (color-coded by domain), point value
- [ ] Tasks with `is_community_task = true` show a secondary accent color and "also earns community pts" label
- [ ] Checking off a task: POSTs to `/api/v2/tasks/[id]/complete`, creates `task_completions` row, increments `profiles.spendable_points` by `point_value`, updates UI optimistically
- [ ] Already-completed tasks (completion exists for today) render checked and disabled
- [ ] "Log a session" button opens an inline form: title (text), domain (select from LIFE_DOMAINS), optional notes — submits to `/api/v2/tasks/log`, creates an ad-hoc `task_completions` entry, appears in today's log
- [ ] Header shows: display name, streak (count of consecutive days with ≥1 completion), total spendable points, current level (points ÷ 100, floor)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/(v2)/today/page.tsx` — server component, loads tasks + completions
- Create: `apps/web/src/components/v2/today/today-tabs.tsx` — client tab switcher (Daily Card | Calendar stub)
- Create: `apps/web/src/components/v2/today/daily-card.tsx` — required tasks + goal tasks sections
- Create: `apps/web/src/components/v2/today/task-row.tsx` — single task row (checkbox, label, tag, pts)
- Create: `apps/web/src/components/v2/today/log-session-form.tsx` — inline ad-hoc session logger
- Create: `apps/web/src/components/v2/shared/domain-tag.tsx` — colored `#domain` chip
- Create: `apps/web/src/components/v2/shared/points-header.tsx` — greeting + streak + pts + level
- Create: `apps/web/src/app/api/v2/tasks/[id]/complete/route.ts` — POST complete a task
- Create: `apps/web/src/app/api/v2/tasks/log/route.ts` — POST log an ad-hoc session

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-017`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-017 <pr-url>`.

## Notes

GRO-019 (Coach wizard) and GRO-021 (Community) can be claimed in parallel after GRO-016 merges — they touch different directories.
GRO-018 (Calendar tab) is blocked until this merges.
