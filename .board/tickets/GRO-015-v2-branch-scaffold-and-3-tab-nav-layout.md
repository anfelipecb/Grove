---
id: "GRO-015"
title: "v2 branch scaffold and 3-tab nav layout"
slug: "v2-branch-scaffold-and-3-tab-nav-layout"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "foundation"]
depends_on: []
created_at: "2026-05-13T15:43:36.531Z"
updated_at: "2026-05-13T15:43:36.531Z"
---

## Context

This is the foundation ticket for the Grove v2 ADHD-focused redesign. Full spec at `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`.

v2 replaces the current 5-tab nav (Dashboard · Calendar · Communities · Onboarding · Mycelium) with a focused 3-tab structure: **Today · Coach · Community**. This ticket sets up the new routing, layout shell, and nav component — with empty placeholder pages. No data, no logic yet.

The v2 app lives in `apps/web/src/app/(v2)/` as a Next.js route group so the existing v1 routes (`/dashboard`, `/calendar`, etc.) are untouched on master. The v2 root route redirects `/` to `/today` for authenticated users.

**Do not delete v1 routes.** Both v1 and v2 routes coexist on this branch.

## Acceptance Criteria

- [ ] Route group `apps/web/src/app/(v2)/` exists with `layout.tsx`
- [ ] Routes `/today`, `/coach`, `/community` each render a placeholder page with the module name
- [ ] `V2Nav` component renders bottom tab bar on mobile (<768px) and top nav bar on desktop (≥768px)
- [ ] Active tab is highlighted; nav uses Next.js `Link` and `usePathname`
- [ ] Navigating between the 3 tabs works without full-page reload
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/app/(v2)/layout.tsx` — v2 root layout wrapping all 3 routes, renders `<V2Nav>`
- Create: `apps/web/src/app/(v2)/today/page.tsx` — placeholder (`<main>Today</main>`)
- Create: `apps/web/src/app/(v2)/coach/page.tsx` — placeholder
- Create: `apps/web/src/app/(v2)/community/page.tsx` — placeholder
- Create: `apps/web/src/components/v2/layout/v2-nav.tsx` — responsive nav component

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-015`.
- Work inside the generated `.worktrees/GRO-015-v2-branch-scaffold-and-3-tab-nav-layout` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-015 <pr-url>`.

## Notes

GRO-016 (DB migration) can be claimed in parallel once this is in `in_review` — they touch different files.
