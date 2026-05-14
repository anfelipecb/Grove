---
id: "GRO-034"
title: "Find Time → real 30-min clock slots using free-window computation"
slug: "find-time-real-30-min-clock-slots-using-free-window-computation"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "ai", "scheduling"]
depends_on: ["GRO-033"]
created_at: "2026-05-13T22:55:00.000Z"
updated_at: "2026-05-13T22:55:00.000Z"
---

## Context

Spec + full implementation plan: `docs/superpowers/plans/2026-05-13-time-aware-scheduling.md`

Currently the Find Time AI outputs vague buckets (`time_of_day: "morning" | "afternoon" | "evening"`). This ticket makes it output actual clock times like `"09:30"` with `duration_minutes: 30` by computing real free windows.

**Free window computation:**
1. Take each day 6am–11pm
2. Subtract sleep window (from `profiles.schedule_profile`)
3. Subtract work hours (from `schedule_profile`, skip for `work_build` tasks)
4. Subtract Google Calendar events (from stored token in `profiles.google_calendar_token`)
5. Remaining slots = available time

The AI receives the free windows as structured context and places each task in the earliest slot that matches its `preferred_time`.

## Acceptance Criteria

- [ ] `apps/web/src/lib/free-windows.ts` created with `computeFreeWindows()` and `slotTaskIntoWindows()` — pure functions, no Supabase calls
- [ ] Find Time route (`/api/ai/find-time`) imports `computeFreeWindows`, computes windows, passes them to the AI prompt
- [ ] AI output type changes: `start_time: string` ("HH:MM") + `duration_minutes: number` replace `time_of_day`
- [ ] Accepted plan writes `start_time` + `duration_minutes` to `scheduled_tasks` (via the updated schedule route from GRO-033)
- [ ] `FindTimePanel` preview shows clock times (`09:30 (30min)`) instead of emoji buckets
- [ ] Falls back gracefully when no Google Calendar token — uses schedule_profile only
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/lib/free-windows.ts`
- Modify: `apps/web/src/app/api/ai/find-time/route.ts`
- Modify: `apps/web/src/components/v2/today/find-time-panel.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-034`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-034 <pr-url>`

## Notes

- GRO-033 must be merged first (adds `start_time` column + PATCH route)
- Can run in parallel with GRO-035
- The full `computeFreeWindows` and `slotTaskIntoWindows` implementation is in the plan doc
- Google Calendar helper is at `apps/web/src/lib/google-calendar.ts` — `fetchCalendarEvents`, `busyBlocksFromEvents`, `getValidToken`
