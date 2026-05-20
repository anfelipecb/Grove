---
id: "GRO-079"
title: "Goals — domain-aware activity tracking week and month views"
slug: "goals-domain-aware-activity-tracking-week-and-month-views"
status: "done"
priority: "p1"
owner: "cursor"
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/68"
labels: []
depends_on: []
created_at: "2026-05-20T22:00:00.000Z"
updated_at: "2026-05-20T22:13:55.812Z"
---

## Context

`GoalsProgressSection` (GRO-072) shows aggregate stats + a Mon–Sun bar chart but **not by life domain**. After GRO-078 places **Domain levels** above, **Tracking** should answer: *what did I actually do last week or month, and in which domains?* — connecting activity to the level bars above.

Coach stays for planning; Goals owns **remembering** past follow-through.

## Acceptance Criteria

**Data (`goals/page.tsx`):**

- [ ] Extend 30-day `task_completions` query to include domain: join `tasks(domain)` (same pattern as `/api/v2/coach/domain-points`) or second query keyed by `task_id`.
- [ ] Pass `completions30d: { task_id, completed_date, domain }[]` (or parallel map) into `GoalsView`.

**UI (`goals-progress-section.tsx` — rename section title to **“Tracking”**):**

- [ ] One-line intro under header: ties to domain levels above (e.g. “Tasks you finished, by life domain.”) — ≤ 90 chars.
- [ ] **Week | Month** segmented control (single primary control row; not two filled CTAs elsewhere).
- [ ] **Week view:** keep/improve current Mon–Sun total bar chart; add **per-domain row** for current week: domain chip + count + thin bar (relative to max domain count that week).
- [ ] **Month view:** last 30 days — total tasks completed + **per-domain breakdown** (7 rows, hide domains with 0 or show muted 0).
- [ ] Top summary cards adapt to selected range (e.g. week: “{N} tasks this week”, month: “{N} tasks this month”; streak can stay global).
- [ ] `prefers-reduced-motion`: no required animation beyond CSS bar width.
- [ ] ADHD copy: short labels; domain names from `LIFE_DOMAINS`; no second headline-tier block inside section.
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: `apps/web/src/app/(v2)/goals/page.tsx`
- Modify: `apps/web/src/components/v2/goals/goals-progress-section.tsx`
- Modify: `apps/web/src/components/v2/goals/goals-view.tsx` — props pass-through only (avoid layout reorder; GRO-078 owns section order)

## Agent Workflow

- Claim after GRO-078 merges **or** rebase onto `master` with GRO-078 present to avoid `goals-view.tsx` conflicts.
- Claim: `pnpm board:ticket:start GRO-079`
- After PR: `pnpm board:ticket:review GRO-079 <pr-url>`

## Notes

- Builds on GRO-072 sparkline; may subsume/replace generic “This month” card with range-aware copy.
- Do not move domain level bars into this section (stay in GRO-078).
- Optional follow-up (out of scope): compare week-over-week delta per domain.
