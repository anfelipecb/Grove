---
id: "GRO-038"
title: "Onboarding v2 — multi-intention intake with contextual domain explanation"
slug: "onboarding-v2-multi-intention-intake-with-contextual-domain-explanation"
status: "done"
priority: "p1"
owner: "worker-038"
branch: "ticket/gro-038-onboarding-v2-multi-intention-intake-with-contextual-domain-explanation"
worktree: ".worktrees/gro-038-onboarding-v2-multi-intention-intake-with-contextual-domain-explanation"
pr_url: "https://github.com/anfelipecb/Grove/pull/23"
labels: []
depends_on: []
created_at: "2026-05-19T23:01:15.534Z"
updated_at: "2026-05-19T23:23:48.773Z"
---

## Context

The current `CoachWizard` (step 0) asks users to pick a single life domain from an abstract list. Most ADHD users don't think in "Wellbeing" or "Life Admin" — they think in concrete life frustrations. This ticket replaces that with a free-text multi-intention input and an AI layer that maps the user's own words to domains, generating rationale phrases like "You mentioned 'getting better sleep' → **Wellbeing**."

**New wizard flow:**
- Step 0: free-text textarea — "What do you want to improve in your life right now? Write 2–3 things."
- Step 1: AI-parsed domain cards, each with the user's own words as rationale + a suggested starter goal
- Steps 2–3: unchanged (task refinement → confirmation)

## Acceptance Criteria

- [ ] Step 0 UI: textarea (max 400 chars), placeholder examples hint, no domain picker
- [ ] `POST /api/v2/coach/parse-intentions` created — calls Groq (8b-instant for now; balanced tier after GRO-037 merges) and returns `{ intentions: [{ domain: LifeDomainId, rationale: string, sampleGoal: string }] }` — rationale grounded in user's text
- [ ] Step 1 shows parsed domain cards with contextual rationale (not abstract label + icon)
- [ ] User can select 1–3 goals across multiple domains (previously only one domain allowed)
- [ ] Existing save path (`/api/v2/coach/setup`) unchanged — already handles an array of goals
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/app/api/v2/coach/parse-intentions/route.ts`
- Modify: `apps/web/src/components/v2/coach/coach-wizard.tsx` — Steps 0 and 1

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-038`.
- Work inside the generated `.worktrees/GRO-038-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-038 <pr-url>`.

## Notes

- The wizard lives at `apps/web/src/components/v2/coach/coach-wizard.tsx`
- `LIFE_DOMAINS` enum is already defined — import it for the route to validate domain IDs
- Fallback: if Groq fails, show generic domain cards (current behavior)
- GRO-041 depends on this ticket merging first
