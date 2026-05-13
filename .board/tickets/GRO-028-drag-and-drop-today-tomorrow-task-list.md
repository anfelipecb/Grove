---
id: "GRO-028"
title: "Drag-and-drop Today/Tomorrow task list"
slug: "drag-and-drop-today-tomorrow-task-list"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "ux"]
depends_on: ["GRO-025"]
created_at: "2026-05-13T21:36:06.808Z"
updated_at: "2026-05-13T21:36:06.808Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-task-scheduling-find-time-design.md`

The tactile, manual counterpart to GRO-027's AI scheduling. A user can drag any active task from their task list into the "Today" or "Tomorrow" slots, and reorder tasks within a day. On drop, writes/removes from `scheduled_tasks`. This gives users direct control without needing the AI agent.

Uses `@dnd-kit/core` + `@dnd-kit/sortable` — the standard drag-and-drop library for React/Next.js apps (no jQuery, no HTML5 drag API quirks on mobile).

## Acceptance Criteria

- [ ] Active tasks list on Today is draggable (sortable within the list)
- [ ] "Today" scheduled slot and "Tomorrow" scheduled slot are drop targets
- [ ] Dragging a task onto Today inserts a `scheduled_tasks` row for today's date (optimistic, rollback on error)
- [ ] Dragging a task onto Tomorrow inserts a `scheduled_tasks` row for tomorrow's date
- [ ] Dragging a task already in a slot back to the unscheduled list removes the `scheduled_tasks` row
- [ ] Reordering within Today/Tomorrow updates a `sort_order` integer on `scheduled_tasks` (add column via migration `0012_scheduled_tasks_sort_order.sql`)
- [ ] Drag works on both mobile (touch) and desktop (pointer)
- [ ] `@dnd-kit/core` and `@dnd-kit/sortable` added as dependencies
- [ ] `pnpm typecheck` passes

## File Map

- Create: `supabase/migrations/0012_scheduled_tasks_sort_order.sql` — add `sort_order integer default 0` to `scheduled_tasks`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` — wrap task list + Today slot in DndContext
- Modify: `apps/web/src/components/v2/today/plan-tomorrow.tsx` — make Tomorrow slot a drop target
- Modify: `apps/web/src/app/api/v2/calendar/schedule/route.ts` — accept `sort_order` in POST body
- Create: `apps/web/src/components/v2/today/draggable-task-row.tsx` — DnD wrapper around TaskRow

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-028`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-028 <pr-url>`.

## Notes

- Install: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --filter @grove/web`
- Keep drag handles subtle — a grip icon (`GripVertical` from lucide) on the left of each task row.
- GRO-025 must be merged first (provides the task list foundation). GRO-027 is independent — can run in parallel.
