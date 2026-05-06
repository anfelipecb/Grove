---
id: "GRO-012"
title: "Improve dark UI contrast and hierarchy"
slug: "improve-dark-ui-contrast-and-hierarchy"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: []
depends_on: []
created_at: "2026-05-06T23:47:47.961Z"
updated_at: "2026-05-06T23:48:50.000Z"
---

## Context

GRO-008 established the shell and theme system, but the current dark experience still feels under-resolved. Multiple surfaces use low-contrast copy, muted-on-muted combinations, and light-mode-biased utility classes that become hard to read in dark mode. The result is that the dark UI looks lazy instead of intentional, especially on text-heavy product screens where clarity matters more than glass or atmosphere.

This ticket is specifically about readability, hierarchy, and polish in dark mode. It should improve contrast across the main signed-in product without turning the UI into a neon theme or breaking the lighter visual direction Grove already has in light mode.

## Acceptance Criteria

- [ ] Audit the dark UI across the main signed-in routes: `/dashboard`, `/onboarding`, `/calendar`, `/communities`, and `/mycelium`.
- [ ] Primary text, secondary text, labels, buttons, inputs, cards, and empty states are clearly legible in dark mode without relying on washed-out gray-on-gray combinations.
- [ ] Replace hard-coded light-mode-biased color classes on shared surfaces with semantic theme tokens where needed so dark mode does not depend on accidental Tailwind defaults.
- [ ] Improve visual hierarchy in dark mode so headings, body copy, metadata, and muted helper text read as deliberately tiered rather than uniformly dim.
- [ ] Interactive states in dark mode feel intentional: hover, focus, selected, disabled, and error states remain readable and distinct.
- [ ] Preserve the black-based Grove dark direction from GRO-008; do not shift the app into a generic purple or overly glossy theme.
- [ ] Light mode remains visually stable. No regressions to readability or spacing in the existing light UI.

## Implementation Guidance

- Start with the shared tokens and the most repeated surface primitives before tuning page-specific exceptions.
- Prioritize fixing places that currently use classes like `text-stone-*`, `bg-* / opacity`, or low-emphasis border combinations directly inside product components.
- Review [apps/web/src/app/globals.css](/Users/anfelipecb/projects/Grove/apps/web/src/app/globals.css), [apps/web/src/components/dashboard/dashboard-ui.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/components/dashboard/dashboard-ui.tsx), [apps/web/src/components/grove-dashboard.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/components/grove-dashboard.tsx), [apps/web/src/components/onboarding-flow.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/components/onboarding-flow.tsx), and the community/Mycelium surfaces for token drift.
- Validate on phone and desktop. Some of the worst contrast problems tend to show up on small-screen cards and sticky toolbars.

## Notes

- Scope:
  dark-mode readability, theme token cleanup, and surface hierarchy polish.
- Out of scope:
  new dashboard features, new reward systems, or rewriting the whole visual language again.
- File collision risk:
  medium-high around `globals.css`, shared dashboard primitives, onboarding surfaces, and community/shared cards.
