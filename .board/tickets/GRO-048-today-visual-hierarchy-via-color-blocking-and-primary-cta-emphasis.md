---
id: "GRO-048"
title: "Today: visual hierarchy via color blocking and primary CTA emphasis"
slug: "today-visual-hierarchy-via-color-blocking-and-primary-cta-emphasis"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-048-today-visual-hierarchy-via-color-blocking-and-primary-cta-emphasis"
worktree: ".worktrees/gro-048-today-visual-hierarchy-via-color-blocking-and-primary-cta-emphasis"
pr_url: "https://github.com/anfelipecb/Grove/pull/34"
labels:
  - "v2"
  - "today"
  - "web"
  - "ux"
  - "design"
depends_on:
  - "GRO-047"
created_at: "2026-05-19T23:59:07.158Z"
updated_at: "2026-05-20T01:09:42.613Z"
---

## Context

Stakeholder feedback (May 2026): use **stronger color blocking and contrast between components** so primary CTAs (complete task, add task, find time) stand out. Today desktop/mobile uses many similar `rounded-xl border border-border bg-card` panels, so everything reads at the same visual weight.

GRO-012 improved dark-mode contrast on v1 routes; this ticket targets **v2 Today** layout hierarchy (primary vs secondary surfaces), not a full theme rewrite.

**Depends on GRO-047** so copy reduction lands first; this pass applies visual tiering without fighting long text blocks.

## Acceptance Criteria

- [ ] **Primary surface (tasks):** Task card/column uses distinct background or border treatment (e.g. stronger contrast, subtle moss tint, or elevated shadow) vs secondary panels
- [ ] **Secondary surfaces:** Coach nudge, Community pulse, Find Time, Next Unlocks, Domain progress use a muted tier (lighter border, lower contrast bg, or compact density) so they read as supporting, not co-equal with tasks
- [ ] **One primary CTA per column/region:** “Add task” / “Find time for my tasks” / main complete affordance uses consistent primary button styling; secondary actions are text links or ghost buttons
- [ ] **Stats row:** Remains scannable (numbers dominant); labels stay small and low-contrast
- [ ] **Light and dark mode:** Hierarchy holds in both themes; no new gray-on-gray body text (follow semantic tokens from app shell)
- [ ] **Accessibility:** Focus rings and contrast for primary buttons meet reasonable legibility (WCAG AA target for text on primary buttons where feasible without redesigning brand colors)
- [ ] `pnpm typecheck` passes

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-048` only after GRO-047 is merged or coordinate in one branch if doing sequentially in same session.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-048 <pr-url>`.

## File Map

- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx`
- Modify: `apps/web/src/components/v2/today/today-stats-row.tsx`
- Modify: `apps/web/src/components/v2/today/task-row.tsx` (complete/check affordance emphasis if needed)
- Optional: `apps/web/src/app/globals.css` or shared v2 card primitives — only if a reusable `surface-primary` / `surface-secondary` pattern helps

## Notes

- Out of scope: redesigning Coach or Community tabs, new illustration, or changing XP math.
- If GRO-047 is still in review, keep this ticket in `ready` and do not claim until merge to avoid merge conflicts on Today files.
- Reference spec: v2 “ADHD-first… visual progress… no overwhelming views.”
