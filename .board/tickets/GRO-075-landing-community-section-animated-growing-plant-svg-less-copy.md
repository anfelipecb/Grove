---
id: "GRO-075"
title: "Landing community section — animated growing plant SVG, less copy"
slug: "landing-community-section-animated-growing-plant-svg-less-copy"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["landing", "ux", "motion"]
depends_on: []
created_at: "2026-05-20T21:34:53.045Z"
updated_at: "2026-05-20T21:34:53.045Z"
---

## Context

The **“Why community matters”** block on the marketing landing (`landing-experience.tsx`, ~lines 276–303) is a heavy text + bullet list on a dark `bark → moss` gradient. Copy repeats themes already covered above the fold and in **See it grow** (including the live buddy-coordination demo). The section should feel **fresh, light, and alive** — motion and metaphor instead of another paragraph.

**Product thesis to express visually (not in prose):** personal follow-through and community participation reinforce each other — like one plant: roots (solo Today/Coach) and visible growth toward others (Community).

## Design direction

- **Less copy:** At most one eyebrow + one short H2 (≤ ~12 words). No bullet list, no “promise of Grove” sub-panel, no second headline-tier block (landing H1 rule).
- **More movement:** Subtle continuous animation — e.g. SVG plant/stem/leaves that **grows in stages** (seed → sprout → branch → small nodes for “you” + “community”), loop or scroll-triggered once.
- **Tech preference:** **Inline SVG + CSS / `motion-safe:` Tailwind** first (no new runtime deps). Only add **d3** if needed for a specific path animation that SVG/CSS cannot do cleanly; default is **no d3**.
- **Tone:** Grove tokens — `moss`, `fern`, `marigold`, `bark`; glassy light surfaces on dark gradient; ADHD-friendly: calm, not flashy.
- **`prefers-reduced-motion`:** Show final “fully grown” static frame; disable loop/spin.

## Acceptance Criteria

- [ ] Extract block into `apps/web/src/components/landing-community-growth.tsx` (or similar); import from `landing-experience.tsx`.
- [ ] Remove the right-column bullet list (“The promise of Grove” + 3 items) and long body paragraph.
- [ ] Copy budget: **one** `text-xs` eyebrow (e.g. “Why community matters”) + **one** H2; optional **one** subline ≤ 90 chars OR icon-only legend — not both long subline and legend.
- [ ] Centerpiece: responsive **SVG plant growth** animation (roots/base → stem → 2–3 leaves/branches; optional small dots/avatars as leaf nodes suggesting members).
- [ ] Layout: visual **≥ 60%** width on `lg+`; text column compact. Section height similar or slightly shorter than today — no wall of text.
- [ ] Animation: loop ~12–18s or replay on `IntersectionObserver` when section enters viewport; respects `prefers-reduced-motion`.
- [ ] Dark mode: gradient + SVG readable on `dark:` backgrounds.
- [ ] Landing UX checklist: no competing H1; no extra marketing paragraphs; section does not outweigh **See it grow** in visual weight.
- [ ] `pnpm typecheck` passes; no new required npm deps unless justified in PR notes.

## File Map

- Create: `apps/web/src/components/landing-community-growth.tsx` (SVG + animation + minimal copy)
- Modify: `apps/web/src/components/landing-experience.tsx` (replace existing community `<section>`)
- Optional: `apps/web/src/app/globals.css` or `tailwind.config.ts` only if new keyframes are needed

## Reference

- Current section to replace:

```276:303:apps/web/src/components/landing-experience.tsx
        <section className="rounded-[2rem] border border-white/45 bg-gradient-to-r from-bark via-bark to-moss ...">
          {/* eyebrow + H2 + long paragraph + bullet panel */}
        </section>
```

- Motion patterns to match: `landing-growth-demo.tsx`, `landing-growth-section.tsx` (glass, moss accents, `motion-safe:`).

## Agent Workflow

- Read `AGENTS.md` and landing UX rules in `CLAUDE.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-075`
- Work in the generated worktree only.
- After PR: `pnpm board:ticket:review GRO-075 <pr-url>`

## Notes

- **Do not** duplicate buddy-invite UI here — **See it grow** already demos Community; this section is **metaphor + mood**, not a second product demo.
- Consider a single line under the plant: “Roots in your plan. Branches in your people.” (or shorter) — cut if it competes with the visual.
- If SVG path animation is too heavy for v1, ship **CSS scale/opacity staged growth** on simple paths first; iterate in follow-up ticket.
