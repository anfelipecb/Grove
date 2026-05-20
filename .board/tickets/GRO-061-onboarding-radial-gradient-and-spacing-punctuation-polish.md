---
id: "GRO-061"
title: "Onboarding radial gradient and spacing punctuation polish"
slug: "onboarding-radial-gradient-and-spacing-punctuation-polish"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "onboarding", "design", "bug"]
depends_on: ["GRO-058"]
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:00:00.000Z"
---

## Context

Bundle of polish items from the diagnostic exploration:
1. **Gradient**: `onboarding-wizard.tsx` still uses `bg-gradient-to-b from-moss/10 to-background`; the design spec called for a radial gradient centered at the top.
2. **Punctuation spacing**: AI-generated copy has " ." and " ," patterns (space before punctuation) — e.g. "grove-welcome ." and "Good evening , Alex". These come from string template interpolation.
3. **Chip casing**: AI-suggested chips (friction, goals) are lowercase ("unclear next steps") while static chips are title case. Normalize before render.
4. **Domain weights scroll**: The top domain on step 4 is clipped — needs padding at the top of the list.

## Acceptance Criteria

- [ ] `apps/web/src/app/onboarding/onboarding-wizard.tsx` — replace linear gradient with `bg-[radial-gradient(ellipse_at_top,_hsl(138_24%_39%/0.12)_0%,_transparent_60%)]` (or equivalent radial from-moss/10 variant)
- [ ] Grep for `" ."` and `" ,"` patterns in coach-dashboard-context.ts, onboarding-wizard.tsx, and greeting templates — fix string interpolation (e.g. trim display_name before interpolation, or use `name.trim()`)
- [ ] AI chip label normalization: before rendering a chip from an AI response, apply `label.charAt(0).toUpperCase() + label.slice(1)` — no external dep needed
- [ ] Domain weights step: add `pt-3` or `scroll-pt-3` to the weights list container so top item is not clipped on scroll
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/onboarding/onboarding-wizard.tsx`
- Grep and fix: `apps/web/src/lib/coach-dashboard-context.ts` (punctuation)

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-061`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-061 <pr-url>`

## Notes

- **GRO-058 must merge first** — both tickets modify `onboarding-wizard.tsx`. Claiming GRO-061 while GRO-058 is in progress will cause merge conflicts.
- Tailwind JIT may need a `safelist` entry or use a `style` prop for the radial gradient if the class isn't statically detectable
