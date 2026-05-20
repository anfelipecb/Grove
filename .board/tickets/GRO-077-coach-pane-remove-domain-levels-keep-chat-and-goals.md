---
id: "GRO-077"
title: "Coach pane — remove domain levels, keep chat and goals"
slug: "coach-pane-remove-domain-levels-keep-chat-and-goals"
status: "done"
priority: "p1"
owner: "cursor"
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/66"
labels: []
depends_on: []
created_at: "2026-05-20T22:00:00.000Z"
updated_at: "2026-05-20T22:13:53.745Z"
---

## Context

Coach sidebar (`CoachSidebar`) currently leads with **Profile → Domain levels** (7-domain XP bars), then Rewards, then a duplicate **Goals** list. Domain progression belongs on **Goals** (life-domain growth), not beside Mycelium chat. Coach should stay focused on **conversation + defining/editing goals + rewards**, not long-term domain stats.

**Parallel with:** GRO-078 (adds domain levels to Goals). This ticket only **removes** from Coach; do not reimplement levels here.

## Acceptance Criteria

- [ ] `coach-sidebar.tsx` — remove `DomainLevels` import and the Profile/domain block from the top section.
- [ ] Rewards shop remains in Coach sidebar (collapsed default is fine).
- [ ] Goals list in Coach sidebar remains (Add / Edit → `CoachWizard`) so Coach still helps create and refine goals.
- [ ] `coach-experience.tsx` — mobile second tab label no longer implies “Profile” for stats removed; rename to **“Plan”** or **“Goals”** (pick one; not “Profile”).
- [ ] `today-desktop.tsx` — footer link **“Domain levels →”** currently points to `/coach`; change to `/goals` (anchor optional: `#domain-levels` once GRO-078 lands).
- [ ] Dead path cleanup (optional, same PR): remove unused `DomainLevels` from `coach-checkin.tsx` if still imported, or delete file if wholly unused.
- [ ] No regression: Coach chat panel unchanged; wizard flows unchanged.
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: `apps/web/src/components/v2/coach/coach-sidebar.tsx`
- Modify: `apps/web/src/components/v2/coach/coach-experience.tsx`
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Optional: `apps/web/src/components/v2/coach/coach-checkin.tsx`

## Agent Workflow

- Claim: `pnpm board:ticket:start GRO-077`
- Work in worktree only.
- After PR: `pnpm board:ticket:review GRO-077 <pr-url>`

## Notes

- Supersedes the “Profile on Coach” placement from GRO-020; API `/api/v2/coach/domain-points` stays (Goals will consume it in GRO-078).
- **Do not** edit `goals-view.tsx` (owned by GRO-078/079).
