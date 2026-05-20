---
id: "GRO-057"
title: "Today empty state — task primacy demote Find Time and Community pulse"
slug: "today-empty-state-task-primacy-demote-find-time-and-community-pulse"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "ux", "bug"]
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:00:00.000Z"
---

## Context

On Today with no tasks, there are 3 competing green CTAs: the Community Pulse card action button, a large centered "+ Add task" button, and a full-width "Find time for my tasks" panel. Plus a second small "+ Add task" in the section header. This violates the UX principle: one primary CTA per region.

GRO-048 improved visual hierarchy when tasks exist. This ticket fixes the empty state specifically.

**Fix:** When `tasks.length === 0`, hide `FindTimePanel` and `CommunityPulseCard`. Show only the large centered "Add task" as the single primary CTA. Remove the duplicate header CTA on empty state.

## Acceptance Criteria

- [ ] `apps/web/src/components/v2/today/daily-card.tsx` — when `tasks.length === 0` (both required and goal tasks empty): do not render `FindTimePanel`, do not render `CommunityPulseCard`, show only the large centered "Add task" button; remove the smaller "+ Add task" in the section header on empty state
- [ ] `apps/web/src/components/v2/today/today-desktop.tsx` — same rule: empty state left column shows single "Add task" CTA only; Find Time and Community Pulse in other columns are hidden when no tasks exist
- [ ] When any tasks exist, all widgets render as before
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/today/daily-card.tsx`
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-057`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-057 <pr-url>`

## Notes

- "Tasks exist" means `required.length > 0 || goalTasks.length > 0` in daily-card terms
- This is a pure conditional render change — no API changes needed
- Do not remove Find Time or Community Pulse from the product; only hide on empty state
