---
id: "GRO-058"
title: "Normalize onboarding domain weights to 100 percent"
slug: "normalize-onboarding-domain-weights-to-100-percent"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-058-normalize-onboarding-domain-weights-to-100-percent"
worktree: ".worktrees/gro-058-normalize-onboarding-domain-weights-to-100-percent"
pr_url: "https://github.com/anfelipecb/Grove/pull/47"
labels: []
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:14:38.284Z"
---

## Context

Step 4 of v1 onboarding (`onboarding-wizard.tsx`) shows domain weight sliders. After AI calibration, weights may total ~69% (clipped/unnormalized output). No running total is shown, so users have no feedback. On save, invalid weights are persisted.

**Fix:** Normalize weights to sum to 100 after AI response (proportional scaling). Show a running total indicator while editing. Ensure save always persists 100%-summing weights.

## Acceptance Criteria

- [ ] After AI calibration response is applied, normalize: `const total = Object.values(weights).reduce((s, v) => s + v, 0); const normalized = Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Math.round(v / total * 100)]))`; then adjust the largest weight to make sum exactly 100
- [ ] Running total displayed below the sliders: "Total: X%" — green when = 100, amber when within ±5, red when outside ±5
- [ ] Slider `onChange` re-normalizes or at minimum updates the running total display
- [ ] On save (submit), weights are normalized before being sent to the API
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/onboarding/onboarding-wizard.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-058`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-058 <pr-url>`

## Notes

- **Conflicts with GRO-061** — both touch `onboarding-wizard.tsx`. Claim GRO-058 first; GRO-061 must wait until this PR merges.
- The normalization approach: proportional scaling preserves relative importance. Largest-weight adjustment handles rounding drift.
