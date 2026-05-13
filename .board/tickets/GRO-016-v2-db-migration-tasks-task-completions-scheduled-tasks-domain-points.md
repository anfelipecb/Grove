---
id: "GRO-016"
title: "v2 DB migration — tasks, task-completions, scheduled-tasks, domain-points"
slug: "v2-db-migration-tasks-task-completions-scheduled-tasks-domain-points"
status: "done"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/14"
labels:
  - "v2"
  - "database"
  - "foundation"
depends_on: []
created_at: "2026-05-13T15:43:40.952Z"
updated_at: "2026-05-13T15:56:41.463Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`

v2 introduces a proper `tasks` table (daily/weekly actions within a goal), `task_completions` (daily log), and `scheduled_tasks` (planning calendar). Also adds `community_points` to `profiles`. The existing `goals` table is kept for high-level goals; `tasks` are the daily actions under them.

**Do not edit existing migrations.** Create one new file: `0008_v2_tasks_and_points.sql`.

## Acceptance Criteria

- [ ] `supabase/migrations/0008_v2_tasks_and_points.sql` created
- [ ] `tasks` table: `id`, `profile_id` (FK profiles), `goal_id` (nullable FK goals), `community_id` (nullable FK communities), `title`, `domain`, `is_required` bool default false, `is_community_task` bool default false, `point_value` int default 10, `community_point_value` int default 0, `frequency` text check ('daily','weekly','once') default 'once', `status` text check ('active','paused','archived') default 'active', `created_at`
- [ ] `task_completions` table: `id`, `task_id` (FK tasks cascade), `profile_id` (FK profiles cascade), `completed_date` date default current_date, `notes` text nullable, `points_earned` int default 0, `community_points_earned` int default 0, `created_at`. Unique `(task_id, profile_id, completed_date)`.
- [ ] `scheduled_tasks` table: `id`, `task_id` (FK tasks cascade), `profile_id` (FK profiles cascade), `scheduled_date` date not null, `created_at`. Unique `(task_id, profile_id, scheduled_date)`.
- [ ] `alter table profiles add column community_points integer not null default 0`
- [ ] RLS enabled + profile-owned SELECT/INSERT/DELETE policies on all 3 new tables (mirror pattern from `0001_initial_schema.sql`)
- [ ] Indexes: `tasks(profile_id)`, `task_completions(profile_id, completed_date)`, `scheduled_tasks(profile_id, scheduled_date)`
- [ ] `pnpm typecheck` passes

## File Map

- Create: `supabase/migrations/0008_v2_tasks_and_points.sql`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-016`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-016 <pr-url>`.

## Notes

GRO-015 can run in parallel — no file overlap.
GRO-017, GRO-019, GRO-021 are blocked until this merges.
