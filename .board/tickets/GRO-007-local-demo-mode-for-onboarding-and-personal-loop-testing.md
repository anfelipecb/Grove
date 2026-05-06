---
id: "GRO-007"
title: "Local demo mode for onboarding and personal loop testing"
slug: "local-demo-mode-for-onboarding-and-personal-loop-testing"
status: "done"
priority: "p1"
owner: "agent-1"
branch: "ticket/gro-007-local-demo-mode-for-onboarding-and-personal-loop-testing"
worktree: "../Grove-agent-1"
pr_url: "https://github.com/anfelipecb/Grove/pull/6"
labels: ["demo", "auth", "testing", "onboarding"]
depends_on: []
created_at: "2026-05-06T20:58:14.414Z"
updated_at: "2026-05-06T21:05:00.000Z"
---

## Context

We need a local-only demo path for onboarding and the personal loop so product work does not require mutating the real Clerk account every time. The demo path must stay aligned with the production data model and UI contracts, but it cannot become a deploy-time auth bypass.

## Acceptance Criteria

- [ ] Local development can enter a demo mode without signing into Clerk.
- [ ] Demo mode can exercise onboarding, dashboard, goals, XP, and reassessment with seeded sample data.
- [ ] The demo path is explicitly disabled outside local development.
- [ ] Production auth and middleware behavior remain unchanged when demo mode is off.
- [ ] Demo data shape matches the real `profiles`, `goals`, and onboarding contracts closely enough that UI work built on demo mode does not need to be rewritten later.

## Notes

- Scope:
  `apps/web/src/middleware.ts`, auth helpers, server data loaders, and a local-only seed/factory path.
- Keep this out of Clerk and Supabase production configuration.
- Prefer a feature flag such as `NEXT_PUBLIC_DEMO_MODE` plus a server-side guard that only allows it in local dev.
- Suggested UX:
  a small local-only entry point from the landing page or sign-in page to "Open demo".
- Non-goal:
  full fixture management or snapshot testing infrastructure.
