---
id: "GRO-002"
title: "Low-friction onboarding with AI-assisted chips"
slug: "low-friction-onboarding-with-ai-assisted-chips"
status: "doing"
priority: "p1"
owner: "agent-2"
branch: "ticket/gro-002-low-friction-onboarding-with-ai-assisted-chips"
worktree: "../Grove-agent-2"
pr_url: ""
labels:
  - "onboarding"
  - "ux"
  - "parallel-safe"
depends_on: []
created_at: "2026-05-06T05:21:48.484Z"
updated_at: "2026-05-06T05:40:33.586Z"
---

## Context

The current onboarding already has a 5-step flow, static goal/friction chips, AI-generated domain weights on step 4, and profile generation at completion. The main feedback is that onboarding still risks overload because it asks for too much blank-page input too early.

This ticket improves the first half of the onboarding so the user can mostly select/refine suggestions instead of writing long answers up front.

## Scope

- Keep the current onboarding persistence model and completion path.
- Keep onboarding as a 5-step flow unless small step-content changes are enough to reduce friction.
- Improve early-step pacing, copy, and interaction so the user sees less blank-page input.
- Add AI-assisted suggested chips or suggestion behavior after lightweight input.
- Preserve manual editing for goals and friction.
- Reuse the existing JSON-based onboarding AI contract; do not require a brand-new endpoint in this pass.

## Acceptance Criteria

- [ ] The first half of onboarding can be completed mostly through selecting or refining suggestions.
- [ ] The flow asks for less open-ended writing up front.
- [ ] Suggested goals and friction options feel tailored to earlier user input.
- [ ] Manual entry for goals and friction still works.
- [ ] Existing onboarding completion still saves profile data, domain weights, and redirects to `/dashboard`.
- [ ] No regression to Clerk auth gating or onboarding step progress.

## Notes

- Suggested owner: `agent-2`
- Suggested worktree: `../Grove-agent-2`
- Main write scope: `apps/web/src/components/onboarding-flow.tsx` and closely related UI helpers only.
- Non-collision rule: avoid provider utility and API route edits unless explicitly coordinated with `GRO-003`.
- Recommended interaction pattern: AI-assisted chips, not a full freeform draft workflow.
