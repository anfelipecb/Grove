---
id: "GRO-066"
title: "Dev mode Unauthorized bypass for onboarding save"
slug: "dev-mode-unauthorized-bypass-for-onboarding-save"
status: "ready"
priority: "p0"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "onboarding", "dev", "bug"]
depends_on: ["GRO-065"]
created_at: "2026-05-20T16:00:00.000Z"
updated_at: "2026-05-20T16:00:00.000Z"
---

## Context

In dev mode at `/dev/onboarding`, clicking "Finish setup" calls `/api/onboarding/save` which requires a Clerk session. Without a session, the API returns 401 Unauthorized and the wizard shows an error, blocking local testing of the full onboarding flow.

**Fix:** In `finishOnboarding()`, when the save API returns 401, treat it as a "dev preview bypass" — build URL params from the wizard's current state and redirect to `/onboarding/done` as if save had succeeded. This way the `/onboarding/done` briefing page (GRO-065) is also testable locally.

## Acceptance Criteria

- [ ] `onboarding-wizard.tsx` `finishOnboarding()`: after the `/api/onboarding/save` fetch, if `profileRes.status === 401`, build redirect URL from local state and call `router.push('/onboarding/done?dev=1&name=...&goals=...')`; do NOT show an error
- [ ] The dev bypass only activates on 401 — all other errors still show the error message
- [ ] In production (where users have Clerk sessions), behavior is identical to before (save succeeds, normal redirect)
- [ ] `/dev/onboarding` → fill all 5 steps → "Finish setup" → arrives at `/onboarding/done` briefing page with the entered data visible
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/onboarding/onboarding-wizard.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-066`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-066 <pr-url>`

## Notes

- **GRO-065 must merge first** — GRO-066 redirects to `/onboarding/done` which GRO-065 creates
- URL params to pass: `name` (from `intake.name`), `goals[]` (from `goalChips` array), `style` (from `intake.supportStyle`), `topDomains[]` (top 2 domains by weight as `"domain:pct"`)
- The `dev=1` param can be read by the briefing page to show a "Preview mode" badge
