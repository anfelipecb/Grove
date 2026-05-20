---
id: "GRO-046"
title: "Landing hero: outcome-led copy and fewer value-prop layers"
slug: "landing-hero-outcome-led-copy-and-fewer-value-prop-layers"
status: "in_review"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-046-landing-hero-outcome-led-copy-and-fewer-value-prop-layers"
worktree: ".worktrees/gro-046-landing-hero-outcome-led-copy-and-fewer-value-prop-layers"
pr_url: "https://github.com/anfelipecb/Grove/pull/27"
labels:
  - "marketing"
  - "landing"
  - "web"
  - "ux"
depends_on: []
created_at: "2026-05-19T23:59:06.594Z"
updated_at: "2026-05-20T00:26:00.811Z"
---

## Context

Stakeholder feedback (May 2026): the landing is strong and comprehensive, but it stacks too many ways of stating the value prop. The current hero uses an emotional H1 (“Some days you know exactly what matters and still cannot begin.”) while the clearer **outcome** line lives in body copy (“Grove helps you turn one messy intention into a few small tasks…”). Eyebrow + H1 + two paragraphs + proof points all compete before the first CTA.

GRO-024 shipped a narrative landing rewrite; this ticket is a **focused pass** aligned with the v2 “less is more” principle: one primary benefit statement above the fold, emotional copy as support (not parallel headlines), and fewer repeated explanations of Today / Coach / Community before sign-up.

Reference: `apps/web/src/components/landing-experience.tsx`

## Acceptance Criteria

- [ ] **One primary message above the fold:** H1 states what Grove does for the user (outcome / audience), e.g. follow-through or “messy intention → small tasks”; emotional line moves to subhead or a single supporting sentence, not a second headline-tier block
- [ ] **Reduce stacked value-prop layers:** Remove or merge redundant eyebrow + paragraph + “three pillars” tour in the hero; at most one short subhead under H1 before CTAs
- [ ] **Preserve CTA paths:** `/sign-up`, `/sign-in`, and demo links unchanged and visually primary
- [ ] **Lower sections:** Audit feature/story sections below the fold; cut duplicate “what is Grove” explanations; each section has one job (problem, system, first day, community, CTA)
- [ ] **ADHD-aware tone:** Plain language, short sentences; avoid em dashes and generic AI-product phrasing
- [ ] **Mobile + desktop:** Hero readable without scrolling on common phone widths; no new horizontal clutter
- [ ] `pnpm typecheck` passes

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-046`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-046 <pr-url>`.

## File Map

- Modify: `apps/web/src/components/landing-experience.tsx`
- Optional: extract hero-only subcomponent under `apps/web/src/components/` if it clarifies structure

## Notes

- Builds on done ticket GRO-024; do not revert auth/demo wiring.
- Out of scope: new illustrations, motion system rewrite, or pricing sections.
- Suggested hero pattern (example, not mandatory copy): H1 = outcome; subhead = emotional recognition; single line on Today / Coach / Community only if needed.
