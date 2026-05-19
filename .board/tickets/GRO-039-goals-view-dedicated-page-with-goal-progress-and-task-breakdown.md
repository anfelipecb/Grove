---
id: "GRO-039"
title: "Goals view — dedicated page with goal progress and task breakdown"
slug: "goals-view-dedicated-page-with-goal-progress-and-task-breakdown"
status: "done"
priority: "p1"
owner: "worker-039"
branch: "ticket/gro-039-goals-view-dedicated-page-with-goal-progress-and-task-breakdown"
worktree: ".worktrees/gro-039-goals-view-dedicated-page-with-goal-progress-and-task-breakdown"
pr_url: "https://github.com/anfelipecb/Grove/pull/24"
labels: []
depends_on: []
created_at: "2026-05-19T23:01:15.826Z"
updated_at: "2026-05-19T23:24:11.400Z"
---

## Context

Goals are the parent objects above tasks in the data model (`goals` → `tasks` via `goal_id`), but the UI buries them in the Coach tab. Users need a dedicated view where goals are first-class: visible, progress-tracked, and expandable to show their child tasks.

**Design:**
- New route `/goals`
- Each goal = card with domain color bar, title, progress ring (tasks checked off this week / total active tasks), expand chevron → task list
- "Add goal" CTA → opens CoachWizard step 0 (not full re-onboarding)
- "Add task to goal" → inline quick input under expanded task list
- Nav: "Goals" link added to bottom nav and desktop sidebar

## Acceptance Criteria

- [ ] `apps/web/src/app/(v2)/goals/page.tsx` created — fetches active goals with their tasks
- [ ] Goal cards show domain color, title, progress ring (tasks completed this week / total)
- [ ] Expand → task list with inline check-off (calls existing task completion endpoint)
- [ ] "Add goal" → opens CoachWizard or `/coach?add=goal` sheet
- [ ] Bottom nav and desktop sidebar include "Goals" link
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/app/(v2)/goals/page.tsx`
- Create: `apps/web/src/components/v2/goals/goal-card.tsx`
- Modify: `apps/web/src/components/v2/layout/bottom-nav.tsx`
- Modify: `apps/web/src/components/v2/layout/desktop-sidebar.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-039`.
- Work inside the generated `.worktrees/GRO-039-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-039 <pr-url>`.

## Notes

- Goals data: `SELECT * FROM goals WHERE profile_id = ? AND status = 'active'` — use Supabase client with Clerk token (existing auth pattern)
- Tasks data: join `tasks` on `goal_id` — count completed this week from `task_completions` table
- Domain colors: match `domain-progress-bars.tsx` color map
- GRO-045 depends on this ticket merging first
