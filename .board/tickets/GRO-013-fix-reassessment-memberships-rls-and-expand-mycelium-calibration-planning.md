---
id: "GRO-013"
title: "Fix reassessment memberships RLS and expand Mycelium calibration planning"
slug: "fix-reassessment-memberships-rls-and-expand-mycelium-calibration-planning"
status: "doing"
priority: "p1"
owner: "agent-1"
branch: "ticket/gro-013-fix-reassessment-memberships-rls-and-expand-mycelium-calibration-planning"
worktree: "../Grove-agent-1"
pr_url: ""
labels: []
depends_on: []
created_at: "2026-05-06T23:47:50.643Z"
updated_at: "2026-05-06T23:51:55.746Z"
---

## Context

Saving `/onboarding?mode=assess` is currently failing for at least one real user path with:

`new row violates row-level security policy (USING expression) for table "memberships"`

The current `POST /api/onboarding/save` route always attempts to upsert the `grove-welcome` membership after saving profile and goals. That side effect is correct for first-time onboarding, but reassessment should preserve the existing user row and avoid duplicate-like membership behavior or other side effects that do not belong to calibration mode.

This ticket also extends recalibration from "edit a few fields and save" into a more useful Mycelium-assisted planning pass. The user intent is that Mycelium should help rebalance goals, suggest rewards, produce a more comprehensive summary, and optionally create adoptable plans/goals rather than only returning plain chat text.

## Acceptance Criteria

- [ ] Reproduce and fix the reassessment save failure on a Clerk-authenticated user who has already completed onboarding and already belongs to `grove-welcome`.
- [ ] `POST /api/onboarding/save` handles `mode=assessment` without triggering the memberships RLS error and without creating duplicate memberships.
- [ ] Reassessment preserves the current user/profile record and updates existing active goals predictably instead of re-running first-time onboarding side effects.
- [ ] Membership creation for `grove-welcome` is only attempted when it is actually needed and via an RLS-safe path.
- [ ] Reassessment produces a more comprehensive calibration result that can include:
  balanced goals,
  suggested rewards,
  a short summary of what changed,
  and an optional plan outline for the next stretch.
- [ ] Mycelium can generate structured, adoptable goals or plans for the user instead of only freeform advice.
- [ ] The user can apply suggested goals/plans into Grove without manual copy-paste; at minimum there is a clear adopt/create flow from the Mycelium-assisted calibration output.
- [ ] All new AI copy remains ADHD-aware, practical, and non-clinical. Crisis handling must continue to short-circuit safely.

## Implementation Guidance

- Start in [apps/web/src/app/api/onboarding/save/route.ts](/Users/anfelipecb/projects/Grove/apps/web/src/app/api/onboarding/save/route.ts). Separate first-time onboarding side effects from reassessment side effects explicitly instead of branching only around goal writes.
- The likely failure point is the unconditional `memberships.upsert(...)` after assessment saves. Check whether reassessment should skip it when the membership already exists or route through a service-role-safe fallback only when needed.
- Review [apps/web/src/components/onboarding-flow.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/components/onboarding-flow.tsx), [apps/web/src/components/mycelium-chat.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/components/mycelium-chat.tsx), and [apps/web/src/app/api/ai/mycelium-chat/route.ts](/Users/anfelipecb/projects/Grove/apps/web/src/app/api/ai/mycelium-chat/route.ts) for the UI and AI integration points.
- Consider whether this needs a new structured AI route for calibration/planning rather than overloading the plain chat response shape.
- Reuse the existing goals/domain context and keep database writes explicit and reviewable. Do not let the AI directly persist arbitrary rows without a user confirmation step.

## Notes

- Scope:
  reassessment save path, memberships/RLS handling, Mycelium calibration output, and adoptable plan/goal creation flow.
- Out of scope:
  a full autonomous planner that silently rewrites the user's whole account without review.
- File collision risk:
  high around onboarding save, Mycelium AI routes, onboarding UI, and any goal creation helpers.
