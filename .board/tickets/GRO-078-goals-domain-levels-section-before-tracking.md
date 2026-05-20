---
id: "GRO-078"
title: "Goals — domain levels section before tracking"
slug: "goals-domain-levels-section-before-tracking"
status: "done"
priority: "p1"
owner: "cursor"
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/67"
labels: []
depends_on: []
created_at: "2026-05-20T22:00:00.000Z"
updated_at: "2026-05-20T22:13:54.756Z"
---

## Context

Domain levels (seniority per life domain from completion XP) should live on **Goals**, not Coach. Users need to see **where they are growing** in each domain before the **activity tracking** block at the bottom of the page.

**Page order (below hero, when goals exist):**

1. Goal cards (tasks + progress rings)
2. **Domain levels** (new section)
3. **Tracking** (`GoalsProgressSection` — enhanced in GRO-079)

**Parallel with:** GRO-077 removes the same UI from Coach. Can merge in either order; brief duplicate on Coach+Goals is acceptable until both land.

## Acceptance Criteria

- [ ] Add `GoalsDomainLevelsSection` (or relocate `domain-levels.tsx` under `goals/`) — reuses `/api/v2/coach/domain-points` (no API move required for v1).
- [ ] Section id `domain-levels` for deep link from Today (`/goals#domain-levels`).
- [ ] Copy: eyebrow **“Life domains”** or **“Domain progress”** — not “Profile”. One short line tying levels to task completions in that domain (≤ 90 chars); no em dashes.
- [ ] Render **after** goal cards grid, **before** `GoalsProgressSection` in `goals-view.tsx`.
- [ ] Empty goals state: still show domain levels + tracking below the empty-state CTA (user may have completions without active goals).
- [ ] Visual: match Goals card surfaces (`rounded-[28px]`, `bg-card/95`); compact list OK on mobile, grid on `sm+`.
- [ ] Progressive disclosure: keep per-domain rows visible (this is the primary purpose of the section); info tooltips via existing `DomainTag` `showInfo`.
- [ ] `pnpm typecheck` passes.

## File Map

- Create: `apps/web/src/components/v2/goals/goals-domain-levels-section.tsx` (wrap or move from `coach/domain-levels.tsx`)
- Modify: `apps/web/src/components/v2/goals/goals-view.tsx` (insert section, layout only)
- Modify (optional): `apps/web/src/components/v2/coach/domain-levels.tsx` → re-export from shared or delete after move

## Agent Workflow

- Claim: `pnpm board:ticket:start GRO-078`
- **Do not** edit `coach-sidebar.tsx` (GRO-077).
- Minimal edit to `goals-progress-section.tsx` — only if renaming outer section title to **“Tracking”** is done here; prefer leaving tracking copy to GRO-079.
- After PR: `pnpm board:ticket:review GRO-078 <pr-url>`

## Notes

- Coach keeps goal wizard; Goals page keeps goal cards + this section.
- Rewards shop stays on Coach (GRO-077).
