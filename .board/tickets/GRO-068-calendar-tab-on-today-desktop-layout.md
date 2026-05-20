---
id: "GRO-068"
title: "Calendar tab on Today desktop layout"
slug: "calendar-tab-on-today-desktop-layout"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "calendar", "ux"]
depends_on: []
created_at: "2026-05-20T17:00:00.000Z"
updated_at: "2026-05-20T17:00:00.000Z"
---

## Context

The Calendar tab (week time-block grid + month view) only renders in `TodayMobileShell → TodayTabs`, which shows on screens smaller than `lg:`. On desktop (`lg:` and above), `TodayDesktop` renders — a 3-column grid with no Calendar tab. Users on desktop Vercel never see the calendar view.

## Acceptance Criteria

- [ ] `apps/web/src/components/v2/today/today-desktop.tsx` — add `activeView: "today" | "calendar"` local state (default `"today"`)
- [ ] Two tab pill buttons rendered above the task column: "Today" and "Calendar"
- [ ] When `activeView === "calendar"`: render `CalendarTab` full-width replacing the 3-column grid
- [ ] When `activeView === "today"`: existing 3-column layout rendered unchanged
- [ ] `CalendarTab` receives `activeTasks` and `googleCalendarConnected` props
- [ ] `CalendarTab` imported from `@/components/v2/today/calendar-tab`
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Modify: `apps/web/src/app/(v2)/today/page.tsx` if `activeTasks` / `googleCalendarConnected` not yet in TodayDesktopProps

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-068`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-068 <pr-url>`

## Notes

- `CalendarTab` is at `apps/web/src/components/v2/today/calendar-tab.tsx`
- Tab pill styling: match the mobile pill style from `today-tabs.tsx`
- Check `TodayDesktopProps` — `activeTasks` may already be there
