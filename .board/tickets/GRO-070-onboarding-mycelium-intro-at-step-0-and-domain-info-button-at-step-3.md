---
id: "GRO-070"
title: "Onboarding — Mycelium intro at step 0 and domain info button at step 3"
slug: "onboarding-mycelium-intro-at-step-0-and-domain-info-button-at-step-3"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "onboarding", "ux"]
depends_on: []
created_at: "2026-05-20T17:00:00.000Z"
updated_at: "2026-05-20T17:00:00.000Z"
---

## Context

Two onboarding clarity gaps identified via Playwright:
1. Mycelium first appears at step 3 ("Mycelium calibrated these from your goals"). Users on step 0 have no idea who/what Mycelium is.
2. The domain weights step (step 3) shows domain names as read-only labels with no explanation of what life domains are or why they matter. The `DomainInfoTooltip` component exists (GRO-063) but is not wired into the wizard.

## Acceptance Criteria

**A. Mycelium intro at step 0:**
- [ ] When `step === 0`, render a small intro card above the name input card: `rounded-xl border border-moss/20 bg-moss/5 px-4 py-3`
- [ ] Content: a Sparkles icon + "Powered by Mycelium" label + one sentence: "Your AI growth coach that learns from what you share and adapts its suggestions over time."

**B. Domain (i) button at step 3:**
- [ ] In `StackedDomainBar` component (inside `onboarding-wizard.tsx`): import `DomainInfoTooltip` from `@/components/v2/shared/domain-info-tooltip`
- [ ] Each domain label chip in the row below the bar renders `<DomainInfoTooltip domainId={d.id} />` after the label text
- [ ] Add a "What are life domains?" text link at the top of the domain card that expands to: "Life domains are the 7 areas of your life Grove tracks. Mycelium uses these weights to prioritize which area gets more attention in your suggestions."

- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/onboarding/onboarding-wizard.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-070`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-070 <pr-url>`

## Notes

- `DomainInfoTooltip` is at `apps/web/src/components/v2/shared/domain-info-tooltip.tsx` — it takes `domainId: LifeDomainId` as a prop
- The Mycelium intro should only appear on step 0 (`{step === 0 && <MycelliumIntroCard />}`) — keep it out of subsequent steps
- Test on `/dev/onboarding` via Playwright to verify both additions render
