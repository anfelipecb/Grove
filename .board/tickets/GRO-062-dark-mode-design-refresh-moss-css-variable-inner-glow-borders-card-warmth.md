---
id: "GRO-062"
title: "Dark mode design refresh — moss CSS variable inner glow borders card warmth"
slug: "dark-mode-design-refresh-moss-css-variable-inner-glow-borders-card-warmth"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "design", "dark-mode"]
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:00:00.000Z"
---

## Context

The current dark mode uses pure black (`#000000`) backgrounds, static `#4d7c55` moss that doesn't adapt, and flat card borders. The result is the green feeling "too opaque/muddy" and the UI lacking depth. Target aesthetic: Linear/Vercel — subtle inner glow on card borders, slightly warm near-black surfaces, lighter moss accent in dark mode.

**Three changes:**

1. **Moss as CSS variable**: Convert `moss` from a static hex to `hsl(var(--moss))` so it can differ between light and dark. Dark value ≈ `#6aaa7e` (lighter, more vibrant without being neon).

2. **Card warmth**: Dark background shifts from pure black to a very dark warm-tinted surface (`hsl(140 10% 4%)`), cards to `hsl(140 8% 7%)`. Barely visible but gives cohesion.

3. **Inner glow border**: Primary and secondary surfaces gain `shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]` — a 1px top highlight that creates depth without blur.

## Acceptance Criteria

- [ ] `apps/web/tailwind.config.ts` — `moss: 'hsl(var(--moss))'` and `moss-fg: 'hsl(var(--moss-fg))'` (replaces static hex; `fern`, `bark`, `clay`, `marigold` remain static)
- [ ] `apps/web/src/app/globals.css :root` — `--moss: 138 24% 39%;` (≈ #4d7c55), `--moss-fg: 0 0% 100%;`
- [ ] `apps/web/src/app/globals.css .dark` — `--moss: 138 30% 53%;` (≈ #6aaa7e), `--moss-fg: 140 15% 10%;`, `--background: 140 10% 4%;`, `--card: 140 8% 7%;`, `--border: 140 5% 16%;`
- [ ] `apps/web/src/components/v2/today/surface-classes.ts` — `surfacePrimary` gains `dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]`; `surfaceSecondary` gains the same inset shadow class
- [ ] Section headers / page titles that use `text-muted-foreground` on h1/h2 elements are updated to `text-foreground` (grep Today, Coach, Goals pages)
- [ ] All existing `bg-moss`, `text-moss`, `border-moss` utilities automatically adopt the new dark value — no component changes needed
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/v2/today/surface-classes.ts`
- Audit (no systematic rewrite needed): `apps/web/src/app/(v2)/today/page.tsx`, `apps/web/src/app/(v2)/coach/page.tsx`, `apps/web/src/app/(v2)/goals/page.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-062`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-062 <pr-url>`

## Notes

- **Test both light and dark** — the CSS variable change must not break light mode. Light mode moss value stays the same `138 24% 39%`.
- `moss-fg` is used as text color on moss-background buttons (`text-moss-fg`). In dark mode with a lighter moss, the foreground needs to be dark — `140 15% 10%` gives a dark green-black.
- GRO-063 (domain tooltip) uses the inner glow border style — merge GRO-062 first so GRO-063 can reference it, or both can ship together.
