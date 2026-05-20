---
id: "GRO-073"
title: "Task start now — schedule on calendar with time confirmation"
slug: "task-start-now-schedule-on-calendar-with-time-confirmation"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "calendar", "ux"]
depends_on: []
created_at: "2026-05-20T19:00:00.000Z"
updated_at: "2026-05-20T19:00:00.000Z"
---

## Context

Tasks in Today only have a completion checkbox. When a user wants to work on something *right now*, there's no way to signal that or block calendar time for it. This ticket adds a "Start →" button to each task that opens a mini time-picker, places the task on today's calendar, and optionally launches a focus session.

**Flow:**
1. "Start →" button appears on each non-completed task row
2. Clicking opens `StartTaskSheet`: task title + current time pre-filled + duration chips (15/30/45/60 min)
3. Two CTAs: **"Schedule"** (confirm + dismiss) and **"Schedule + Focus"** (confirm + open focus session with this task)
4. After confirming: task row shows `📅 3:15 pm` badge; "Start →" becomes "Reschedule"

## Acceptance Criteria

- [ ] `task-row.tsx` — add `onStart?: (taskId: string) => void` prop; when provided, render "Start →" (`text-xs` ghost button) inline after the task title
- [ ] `apps/web/src/components/v2/today/start-task-sheet.tsx` (new) — bottom sheet showing: task title, "Schedule for now" with editable time (pre-fill `new Date()` formatted as HH:MM), 4 duration chips (15/30/45/60 min, default 30), "Schedule" and "Schedule + Focus" buttons
- [ ] Schedule action: `POST /api/v2/calendar/schedule` with `{ task_id, date: todayISO(), start_time: "HH:MM", duration_minutes }`
- [ ] On success: pass scheduled time back to parent; task row shows `📅 {time}` badge from local state (no DB refetch needed)
- [ ] "Schedule + Focus": after API call succeeds, invoke `onStartFocusSession?.()` with the task pre-selected
- [ ] `daily-card.tsx` — pass `onStart` handler to `TaskRow`; maintain `startedTasks: Map<string, string>` (taskId → scheduled time) local state; render `StartTaskSheet` when a task is selected
- [ ] `today-desktop.tsx` — same pattern as daily-card
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/today/task-row.tsx`
- Create: `apps/web/src/components/v2/today/start-task-sheet.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx`
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-073`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-073 <pr-url>`

## Notes

- `POST /api/v2/calendar/schedule` already exists and accepts `{ task_id, date, start_time, duration_minutes }` — reuse it
- The `StartTaskSheet` pattern should match `AddTaskSheet` (same bottom-sheet style, same chip buttons)
- `onStartFocusSession` already exists in `daily-card.tsx` (from GRO-053) — wire the task into it
- "Start →" button should be very subtle — it's a secondary action; the primary action remains the completion checkbox
