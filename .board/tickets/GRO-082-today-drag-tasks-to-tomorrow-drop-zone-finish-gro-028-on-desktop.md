---
id: "GRO-082"
title: "Today drag tasks to tomorrow drop zone — finish GRO-028 on desktop"
slug: "today-drag-tasks-to-tomorrow-drop-zone-finish-gro-028-on-desktop"
status: "done"
priority: "p2"
owner: "cursor"
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/65"
labels: []
depends_on: []
created_at: "2026-05-20T21:57:52.560Z"
updated_at: "2026-05-20T22:04:53.216Z"
---

## Context

**Audit (2026-05-20):** User asked if tasks can move today → tomorrow by dragging.

**Current behavior:**
- **Desktop** (`TodayDesktop`): plain `TaskRow` with **Tomorrow** text button (`onMoveToTomorrow` → `POST /api/v2/calendar/schedule`). **No drag.**
- **Mobile** (`DailyCard`): `@dnd-kit` on **Your goals** only — `handleDragEnd` uses `arrayMove` to **reorder** within the list. **No drop target** for tomorrow.
- **GRO-028** marked `done` but acceptance criteria (Today/Tomorrow **drop targets**, unschedule on drag back) were **not fully implemented** — only `DraggableTaskRow` + sortable reorder shipped.

## Acceptance Criteria

- [ ] **Tomorrow drop zone** in center column (`PlanTomorrow` or dedicated strip): dragging a task onto it calls `schedule` for tomorrow (same API as Tomorrow button).
- [ ] **Today task list** (desktop): draggable rows with grip handle (reuse `DraggableTaskRow` or shared wrapper).
- [ ] **Optional:** Today log area as drop target for "schedule today" per GRO-028 spec.
- [ ] Drag works pointer (desktop) and touch (mobile).
- [ ] Optimistic UI + rollback on API error.
- [ ] **Tomorrow** button remains for non-drag users.
- [ ] Document in PR if `sort_order` migration (GRO-028) is deferred again.
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Modify: `apps/web/src/components/v2/today/plan-tomorrow.tsx` (droppable)
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` (droppable + drag from goals)
- Reuse: `draggable-task-row.tsx`, `task-row.tsx`
- Reference: `.board/tickets/GRO-028-drag-and-drop-today-tomorrow-task-list.md`
- Optional: `supabase/migrations/*_scheduled_tasks_sort_order.sql` if reorder-in-slot required

## Agent Workflow

- Prefer claim **after GRO-081** merges (same center column files).
- Claim: `pnpm board:ticket:start GRO-082`
- After PR: `pnpm board:ticket:review GRO-082 <pr-url>`

## Notes

- `@dnd-kit/core` already in web package from partial GRO-028.
- Do not confuse reorder-only drag with schedule-to-tomorrow — user expectation is **drop on Plan tomorrow**.
- Implemented in PR #65 with GRO-080/081 (`TomorrowDropZone`, `TOMORROW_DROP_ID`).
