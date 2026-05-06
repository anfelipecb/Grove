---
id: "GRO-009"
title: "Mobile-first solo dashboard for goals consistency and XP"
slug: "mobile-first-solo-dashboard-for-goals-consistency-and-xp"
status: "backlog"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["dashboard", "mobile", "solo-loop", "frontend"]
depends_on: ["GRO-008"]
created_at: "2026-05-06T20:58:19.749Z"
updated_at: "2026-05-06T21:05:00.000Z"
---

## Context

The first layer of the product should make it easy to stay on track with personal goals and consistency, especially on phone. The current dashboard needs to become a mobile-first solo loop: fewer competing panels, clearer progress, stronger goal focus, and easier XP tracking.

## Acceptance Criteria

- [ ] Rework the personal dashboard into a mobile-first layout centered on goals, consistency, and points.
- [ ] The first viewport on phone shows the current personal state clearly: active goals, next action, streak/consistency signal, and points/XP.
- [ ] The primary solo workflow feels light enough for repeated daily use.
- [ ] Desktop still works, but phone is the main optimization target.
- [ ] The dashboard reflects assigned time / planning intent clearly enough to support later calendar integration.
- [ ] Solo-layer UI remains visually aligned with the shell/theme system from `GRO-008`.

## Notes

- Scope:
  `GroveDashboard` and adjacent personal-loop components.
- Keep community-heavy surfaces out of this ticket unless they are needed for the top-level layer transition.
- This should not own theme primitives or global layer switching; it should consume them.
