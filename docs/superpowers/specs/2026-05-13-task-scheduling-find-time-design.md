# Task Scheduling & Find Time — Design

**Goal:** Let users create tasks freely on Today, declare their 24-hour schedule, and invoke an AI agent that proposes a realistic weekly plan aligned with their goals, sleep, and available time.

**Architecture:** Four independent tickets in dependency order. Each can be shipped and tested standalone. GRO-025 unblocks all others. GRO-027 and GRO-028 can run in parallel after GRO-026 merges.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS), Groq AI, `@dnd-kit/core` for drag-and-drop, existing `tasks` + `scheduled_tasks` tables.

---

## Dependency Order

```
GRO-025 (Free task add) → GRO-026 (Schedule profile) → GRO-027 (Find Time AI)
GRO-025 (Free task add) → GRO-028 (Drag-and-drop)    [parallel with GRO-026/027]
```

---

## GRO-025 — Free Task Add on Today

### Problem
The only way to create tasks is through the Coach wizard (multi-step). Users need a lightweight "add task" affordance directly on Today.

### Design
A "+" FAB on Today (mobile bottom-right, desktop in left column header) opens a bottom sheet with:
- Title (required text input)
- Domain (7 colored chip buttons matching domain-tag colors)
- Frequency (Daily / Weekly / Once toggle)
- Preferred time of day (Morning / Afternoon / Evening / Flexible toggle)

On submit: `POST /api/v2/tasks` creates the task, optimistic update adds it to the task list immediately.

### DB change
Migration `0010`: add `preferred_time text check (preferred_time in ('morning','afternoon','evening','flexible')) default 'flexible'` to `public.tasks`.

---

## GRO-026 — Schedule Profile + Per-Task Time Preference

### Problem
The Find Time AI needs to know the user's 24-hour structure before suggesting slots. Without this, suggestions are generic and often unrealistic.

### Design
A "My Schedule" section on `/profile` with:
- Bedtime (time select, e.g. 22:00)
- Wake time (time select, e.g. 06:30)
- Work/school hours (start + end, or "No fixed schedule" toggle)
- Free time preference (chip: Mornings / Afternoons / Evenings / Weekends / Flexible)

Stored as `schedule_profile JSONB` on `profiles`:
```json
{
  "bedtime": "22:00",
  "wakeTime": "06:30",
  "workStart": "09:00",
  "workEnd": "17:00",
  "freeTimePreference": "evenings"
}
```

All fields optional. GRO-027 uses defaults when missing: sleep 22:00–06:30, work 09:00–17:00, flexible free time.

Task rows on Today show `preferred_time` and let users change it inline. `PATCH /api/v2/tasks/:id` handles the update.

### DB change
Migration `0011`: add `schedule_profile jsonb` (nullable) to `public.profiles`.

---

## GRO-027 — Find Time AI Agent

### Problem
Users have tasks and a schedule profile but no automated way to turn them into a realistic weekly plan.

### Design
A "Find Time" button on Today (Coach Nudge section on desktop, below task list on mobile) that calls `POST /api/ai/find-time`.

**Input to AI:**
- User's active tasks (title, domain, preferred_time, frequency)
- `schedule_profile` (or defaults)
- Existing `scheduled_tasks` for the current week (to avoid duplicates)
- Today's date + day of week

**AI output:**
```json
{
  "plan": [
    { "task_id": "uuid", "task_title": "...", "date": "2026-05-14", "time_of_day": "morning" },
    ...
  ],
  "newTasks": [
    { "title": "Wind down — no screens", "domain": "rest_play", "frequency": "daily", "preferred_time": "evening" }
  ]
}
```

`newTasks` is used when the AI detects a goal (e.g. wellbeing/rest_play) but no matching sleep hygiene task exists — it auto-creates those tasks then schedules them.

**UI flow:**
1. Click "Find Time" → loading spinner
2. Preview panel slides in: days of week grouped by Morning / Afternoon / Evening, showing which tasks land where
3. User can deselect individual items
4. "Accept plan" writes accepted items to `scheduled_tasks`; `newTasks` are inserted to `tasks` first
5. "Regenerate" re-calls with a `{ regenerate: true }` hint

**Constraints enforced by AI:**
- No tasks during sleep window
- Work-domain tasks may appear during work hours; other domains avoid them
- Respects `preferred_time` — morning tasks → morning slots
- Max 3 tasks per day to avoid overwhelm
- Cap plan at 21 items total

### DB change
None — uses existing `tasks` and `scheduled_tasks` tables.

---

## GRO-028 — Drag-and-Drop Today/Tomorrow

### Problem
Find Time is automatic but users want direct tactile control — drag a task to today or tomorrow without invoking AI.

### Design
Using `@dnd-kit/core` + `@dnd-kit/sortable`:
- Active task list is a sortable list (reorderable)
- Today slot and Tomorrow slot are `useDroppable` targets
- Dragging a task onto a slot → inserts `scheduled_tasks` row (optimistic)
- Dragging from slot back to unscheduled list → removes `scheduled_tasks` row
- Reordering within a slot updates `sort_order` on `scheduled_tasks`
- Touch + pointer sensors both enabled

Visual: `GripVertical` drag handle on left of each task row (shown on hover/focus on desktop, always visible on mobile).

### DB change
Migration `0012`: add `sort_order integer not null default 0` to `public.scheduled_tasks`.

---

## What This Is Not

- **Not** Google Calendar OAuth sync (future ticket)
- **Not** time-blocking with exact clock times (the AI works with morning/afternoon/evening buckets, not 9:00am slots)
- **Not** push notifications or reminders (future)
- **Not** conflict detection with existing calendar events (future, requires OAuth)
