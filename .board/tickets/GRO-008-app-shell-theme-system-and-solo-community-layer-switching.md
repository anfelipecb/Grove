---
id: "GRO-008"
title: "App shell theme system and solo-community layer switching"
slug: "app-shell-theme-system-and-solo-community-layer-switching"
status: "done"
priority: "p1"
owner: "agent-2"
branch: "ticket/gro-008-app-shell-theme-system-and-solo-community-layer-switching"
worktree: "../Grove-agent-2"
pr_url: "https://github.com/anfelipecb/Grove/pull/5"
labels: []
depends_on: []
created_at: "2026-05-06T20:58:17.133Z"
updated_at: "2026-05-06T21:20:39.961Z"
---

## Context

The app needs a coherent shell before we push deeper UI work. Light mode should be mostly white and minimal, with strong hierarchy and restrained glass treatments. Dark mode should be black-based, not muddy. Solo and community layers should feel distinct but aligned, and the user should be able to switch layers from the top of the app.

## Acceptance Criteria

- [ ] Introduce a consistent color/token system that follows system light/dark preference and supports manual switching.
- [ ] Light mode reads as bright, minimal, and high-contrast without using Grove branding colors as the default palette.
- [ ] Dark mode reads as black-based and clearly legible, with the same hierarchy and restraint.
- [ ] Add a minimal top-level layer switch for personal vs community context.
- [ ] Personal and community shells feel different enough to orient the user, while still belonging to one product.
- [ ] The shell works cleanly on phone and desktop without cramped header/nav behavior.

## Notes

- Scope:
  layout shell, nav/header, theme variables, shared surfaces, and top-level context switching.
- This ticket should avoid rewriting the detailed solo dashboard internals; that belongs in `GRO-009`.
- File collision risk:
  high around shared layout, nav, and global styles. Treat this as the shell/tokens ticket.
