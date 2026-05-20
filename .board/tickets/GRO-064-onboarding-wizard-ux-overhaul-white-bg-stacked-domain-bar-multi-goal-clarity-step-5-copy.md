---
id: "GRO-064"
title: "Onboarding wizard UX overhaul — white bg stacked domain bar multi-goal clarity step 5 copy"
slug: "onboarding-wizard-ux-overhaul-white-bg-stacked-domain-bar-multi-goal-clarity-step-5-copy"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "onboarding", "design", "ux"]
depends_on: []
created_at: "2026-05-20T16:00:00.000Z"
updated_at: "2026-05-20T16:00:00.000Z"
---

## Context

Playwright walkthrough of `/dev/onboarding` identified 4 issues:
1. Background is a flat sage gradient — plain, unpolished
2. Step 2 doesn't communicate multi-goal selection (no counter, no clear visual affordance)
3. Step 4 has 7 sliders × (thumb + label + colored bar) = cluttered. Replace with a single stacked color bar.
4. Step 5 labels "Community Interest" and "Focus Context" are vague — users don't know what to write

## Acceptance Criteria

**Background + progress:**
- [ ] Replace `bg-[radial-gradient(...)]` with `bg-background` (clean white)
- [ ] Add a thin 4px top edge accent: `fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-moss/40 via-moss to-moss/40`
- [ ] Progress indicator: 5-segment bar (completed = `bg-moss`, current = `bg-moss/40`, future = `border border-border bg-transparent`) replacing current dot/pill

**Step 2 (Goals) — multi-goal clarity:**
- [ ] H1: "What do you want to grow?" → **"What are you working on right now?"**
- [ ] Subtext: "Pick what resonates. You can add specifics or adjust later." → **"Pick 2 or 3 things — most people come with more than one."**
- [ ] When ≥1 chip selected, show `{count} selected` in `text-xs text-muted-foreground` near the heading
- [ ] Selected chips show a `✓ ` prefix in their label

**Step 4 (Domain weights) — stacked bar:**
- [ ] Remove all 7 `<input type="range">` slider elements
- [ ] Render a single full-width stacked horizontal bar: `flex h-4 w-full overflow-hidden rounded-full` with each domain as a `<div>` whose `flex: 0 0 {weight}%` and background = `DOMAIN_BAR_COLORS[id]`
- [ ] Below bar: 7 read-only label chips `{Domain.label} · {weight}%` in a wrapping flex row
- [ ] Subtext: **"Mycelium calibrated these from your goals. Adjust later in your profile."**
- [ ] CTA button label: "Continue" → **"Looks good →"**
- [ ] `normalizeDomainWeights()` still runs on load; remove `weightsTotal` display (no longer needed without manual editing)

**Step 5 (Community + Focus) — copy:**
- [ ] Label "COMMUNITY INTEREST" → **"WHO DO YOU WANT TO GROW WITH?"**
- [ ] Placeholder "What kind of group helps you stay engaged?" → **"e.g. builders shipping side projects, parents staying consistent, students finishing degrees"**
- [ ] Label "FOCUS CONTEXT (private, optional)" → **"ANYTHING ELSE MYCELIUM SHOULD KNOW?"**
- [ ] Placeholder "Used only to adapt planning and nudges." → **"e.g. I have ADHD, I work nights, I have a big deadline in 3 weeks — Mycelium uses this to adjust its suggestions"**
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/onboarding/onboarding-wizard.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-064`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-064 <pr-url>`

## Notes

- **Conflicts with GRO-065** (both touch `onboarding-wizard.tsx`). Claim and merge GRO-064 before GRO-065 touches the wizard, OR implement both in a single branch.
- `DOMAIN_BAR_COLORS` is already defined in `onboarding-wizard.tsx` — reuse it for the stacked bar segments
- The `normalizeDomainWeights()` function (from GRO-058) runs on AI calibration response — keep it, just remove the interactive sliders
- Test with Playwright at `/dev/onboarding` to screenshot all steps
