---
id: "GRO-035"
title: "Time-block week calendar view with hourly grid and busy slots"
slug: "time-block-week-calendar-view-with-hourly-grid-and-busy-slots"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "calendar", "ui"]
depends_on: ["GRO-033"]
created_at: "2026-05-13T22:55:00.000Z"
updated_at: "2026-05-13T22:55:00.000Z"
---

## Context

Spec + full implementation plan: `docs/superpowers/plans/2026-05-13-time-aware-scheduling.md`

The current `CalendarTab` shows tasks as a flat list grouped by day. This is not time-aware — there's no way to see when during the day tasks are scheduled or where free time exists. This ticket replaces it with a proper time-block grid.

**Design:**
- Desktop: 7-column week view, rows = 30-min slots from 6am to 11pm
- Mobile: single-day column view with day-tab switcher at top
- Scheduled tasks appear as **colored blocks** at their `start_time` (domain colors)
- Google Calendar events appear as **grey "Busy" blocks** (read-only)
- Empty rows = visually clear available time
- Clicking a task block = completes it (or future: opens detail)

## Acceptance Criteria

- [ ] `WeekCalendar` component created at `apps/web/src/components/v2/today/week-calendar.tsx`
- [ ] Shows 7 days from today, hourly grid 6am–11pm
- [ ] Task blocks positioned at `start_time`, height proportional to `duration_minutes`
- [ ] Tasks without `start_time` (null) are NOT shown in the grid (they stay in the task list on Today)
- [ ] Google Calendar busy blocks shown if `googleCalendarConnected=true` (fetched via updated `/api/v2/calendar/[date]` from GRO-033)
- [ ] `GET /api/v2/calendar/[date]` returns `busy` array of `{ title, start, end }` when Google Calendar token exists
- [ ] `CalendarTab` replaces Day/Week/Month views with "Time Blocks" (WeekCalendar) + "Month" views
- [ ] Mobile: single-day view with horizontal day-tab switcher
- [ ] Desktop: full 7-day week grid, horizontally scrollable if viewport too narrow
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/components/v2/today/week-calendar.tsx`
- Modify: `apps/web/src/components/v2/today/calendar-tab.tsx`
- Modify: `apps/web/src/app/api/v2/calendar/[date]/route.ts` — add `busy` to response (needs Google Calendar fetch)
- Modify: `apps/web/src/app/(v2)/today/page.tsx` — pass `googleCalendarConnected` through TodayTabs → CalendarTab → WeekCalendar
- Modify: `apps/web/src/components/v2/today/today-tabs.tsx` — add `googleCalendarConnected` prop

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-035`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-035 <pr-url>`

## Notes

- GRO-033 must be merged first (adds `start_time` + `duration_minutes` to the API responses)
- Can run in parallel with GRO-034
- Full `WeekCalendar` component implementation is in the plan doc — copy it as the starting point
- Domain colors to use: `bg-emerald-200/border-emerald-400` (wellbeing), `bg-blue-200/border-blue-400` (learning), etc. — match `domain-progress-bars.tsx`
- Google Calendar import: `fetchCalendarEvents`, `getValidToken` from `apps/web/src/lib/google-calendar.ts`
