---
id: "GRO-081"
title: "Today log column — Plan tomorrow overflow and split from Day log card"
slug: "today-log-column-plan-tomorrow-overflow-and-split-from-day-log-card"
status: "done"
priority: "p2"
owner: "cursor"
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/65"
labels: []
depends_on: []
created_at: "2026-05-20T21:57:52.560Z"
updated_at: "2026-05-20T22:04:52.299Z"
---

## Context

**Audit (2026-05-20):** On `TodayDesktop` center column, `DayLog` and `PlanTomorrow` share one `surfaceSecondary` card (`today-desktop.tsx` ~319–326). User reports **"PLAN FOR TOMORROW" looks outside the frame** — label sits at bottom of a tall stacked card (~716px column) with no scroll containment; content bleeds past visual card bounds or viewport.

Current structure:

```tsx
<div className={`${surfaceSecondary} p-4`}>
  <p>Today's Log</p>
  <DayLog date={today} />
  <PlanTomorrow tomorrow={tomorrow} activeTasks={activeTasks} />
</div>
```

`PlanTomorrow` adds `mt-4` section with date label, `?` details, scheduled list, and add picker — competes vertically with log entries.

## Acceptance Criteria

- [ ] Split **Today's log** and **Plan for tomorrow** into **two** bordered surfaces (or log card + nested tomorrow sub-card with clear top border).
- [ ] Center column: `max-h` + `overflow-y-auto` on log list and/or tomorrow list so long content scrolls **inside** the column, not past the card edge.
- [ ] **Plan for tomorrow** header + date always visible within its container (sticky sub-header optional).
- [ ] No duplicate H2-tier labels; keep copy minimal per GRO-047.
- [ ] Layout OK at ~361px column width (user DOM: center col ~327px inner).
- [ ] Mobile shell unaffected unless shared component change is intentional.
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: `apps/web/src/components/v2/today/today-desktop.tsx` (center column layout)
- Modify: `apps/web/src/components/v2/today/plan-tomorrow.tsx` (spacing/containment if needed)
- Optional: `apps/web/src/components/v2/today/day-log.tsx` (max-height wrapper)

## Agent Workflow

- Claim: `pnpm board:ticket:start GRO-081`
- Browser-verify at `lg` on `/today` after change.
- After PR: `pnpm board:ticket:review GRO-081 <pr-url>`

## Notes

- Screenshot reference: user DOM path `div.space-y-4[1] > ... PlanTomorrow > p.text-xs... PLAN FOR TOMORROW` at y≈692 inside 716px column.
- Implemented in PR #65 with GRO-080/082 (shared `today-desktop.tsx`).
