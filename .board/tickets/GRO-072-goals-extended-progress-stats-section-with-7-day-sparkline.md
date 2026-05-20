---
id: "GRO-072"
title: "Goals — extended progress stats section with 7-day sparkline"
slug: "goals-extended-progress-stats-section-with-7-day-sparkline"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-072-goals-extended-progress-stats-section-with-7-day-sparkline"
worktree: ".worktrees/gro-072-goals-extended-progress-stats-section-with-7-day-sparkline"
pr_url: "https://github.com/anfelipecb/Grove/pull/58"
labels: []
depends_on: []
created_at: "2026-05-20T17:00:00.000Z"
updated_at: "2026-05-20T18:31:57.308Z"
---

## Context

The Goals page currently shows 3 aggregate stats (active goals count, active tasks count, checked this week). There is no historical trend, no month view, and no sparkline. Users can't see whether they're improving week over week.

## Acceptance Criteria

**Data (goals/page.tsx):**
- [ ] Extend `task_completions` query from "since Monday of this week" to "last 30 days" (`gte completed_date, date 30 days ago`)
- [ ] Add `xp_events` query: `select xp, created_at where profile_id = ? and created_at >= 30 days ago` to compute monthly XP total
- [ ] Pass the 30-day completions and monthly XP to `GoalsView`

**UI (new `GoalsProgressSection` component):**
- [ ] Create `apps/web/src/components/v2/goals/goals-progress-section.tsx`
- [ ] Render below the goal cards list in `goals-view.tsx`
- [ ] Section header: "Your progress"
- [ ] Three stat cards in a row:
  - **Last 7 days**: "{N}/7 days with activity" — count of distinct days with ≥1 completion in last 7 days
  - **This month**: "{N} tasks completed" — count of completions in last 30 days
  - **Streak**: reuse `computeStreak()` from `apps/web/src/lib/streak.ts` or inline equivalent using the 30-day data
- [ ] 7-bar sparkline below the stat cards:
  - 7 bars, one per day Mon–Sun of the current week
  - Each bar height = `(completions_that_day / max_completions_any_day) * 48px` (min height 4px for days with 0)
  - Bars with completions: `bg-moss` rounded; empty bars: `bg-muted` rounded
  - Day label below each bar: "Mon", "Tue", etc. in `text-[10px] text-muted-foreground`
  - Today's bar has a `ring-1 ring-moss/40` outline
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/(v2)/goals/page.tsx` — extend queries to 30 days, pass data
- Modify: `apps/web/src/components/v2/goals/goals-view.tsx` — render `GoalsProgressSection`
- Create: `apps/web/src/components/v2/goals/goals-progress-section.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-072`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-072 <pr-url>`

## Notes

- `computeStreak` utility exists in `apps/web/src/app/(v2)/today/page.tsx` — extract or copy the logic. It takes an array of `{ completed_date: string }` objects.
- The 30-day completions array shape: `{ task_id: string; completed_date: string }[]` — group by `completed_date` for the sparkline
- Monthly XP: sum `xp` field from `xp_events` for the last 30 days
- Keep the sparkline pure CSS (no chart library) — it's just flex with proportional heights using `style={{ height: ... }}`
