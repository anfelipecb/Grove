---
id: "GRO-055"
title: "Skip CoachWizard when onboarding complete — show check-in instead"
slug: "skip-coachwizard-when-onboarding-complete-show-check-in-instead"
status: "done"
priority: "p0"
owner: "cursor"
branch: "ticket/gro-055-skip-coachwizard-when-onboarding-complete-show-check-in-instead"
worktree: ".worktrees/gro-055-skip-coachwizard-when-onboarding-complete-show-check-in-instead"
pr_url: "https://github.com/anfelipecb/Grove/pull/41"
labels: []
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:05:03.938Z"
---

## Context

After completing the 5-step v1 onboarding, navigating to `/coach` shows a second 4-step CoachWizard ("Step 1 of 4"). Root cause: `coach-experience.tsx` renders `CoachWizard` when `hasTasks === false`, but the v1 onboarding saves goals to the `goals` table — it does NOT create rows in the v2 `tasks` table. So `todayTasks.length === 0` after onboarding, triggering the wizard again.

**Fix:** Gate on `onboarding_step >= 5` (already on `profiles`) rather than `hasTasks`. If onboarding is complete, always show `CoachCheckin`; show `CoachWizard` only for brand-new users who have never finished onboarding.

## Acceptance Criteria

- [ ] `apps/web/src/app/(v2)/coach/page.tsx` — fetch `onboarding_step` from profile row (add to existing `select` query)
- [ ] Derive `onboardingComplete = (onboarding_step as number | null ?? 0) >= 5`
- [ ] Pass `onboardingComplete` as a prop to `CoachExperience`
- [ ] `apps/web/src/components/v2/coach/coach-experience.tsx` — update `coachPane`: `onboardingComplete ? <CoachCheckin ...> : <CoachWizard ...>` (replace `hasTasks` guard)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/(v2)/coach/page.tsx`
- Modify: `apps/web/src/components/v2/coach/coach-experience.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-055`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-055 <pr-url>`

## Notes

- This is P0 — first thing to fix before the demo
- `hasTasks` prop can remain on `CoachExperience` (it may still be useful to know if tasks exist for other UI decisions) but should not gate the wizard vs check-in decision
