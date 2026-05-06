---
id: "GRO-003"
title: "Configurable Groq onboarding model with safe fallback"
slug: "configurable-groq-onboarding-model-with-safe-fallback"
status: "doing"
priority: "p2"
owner: "agent-1"
branch: "ticket/gro-003-configurable-groq-onboarding-model-with-safe-fallback"
worktree: "../Grove-agent-1"
pr_url: ""
labels:
  - "onboarding"
  - "ai"
  - "parallel-safe"
depends_on: []
created_at: "2026-05-06T05:21:48.505Z"
updated_at: "2026-05-06T05:40:07.061Z"
---

## Context

The onboarding flow already calls `/api/ai/domain-weights` mid-flow and `/api/ai/profile` at completion. Both routes currently rely on Groq when configured, but the model choice is broad and shared. We want cheaper or free Groq-backed onboarding inference without breaking local fallback.

This ticket makes the onboarding AI model selection explicit and safe while preserving current safety checks and local behavior.

## Scope

- Keep `GROQ_API_KEY`-based behavior.
- Add explicit onboarding model configurability for profile generation and domain-weight generation.
- Preserve current local fallback when Groq is absent.
- Preserve crisis/safety handling.
- Keep response shapes backward-compatible for the current onboarding UI.
- Do not hardcode onboarding-specific behavior deep inside the shared provider utility if a route-level or config-level change is cleaner.

## Acceptance Criteria

- [ ] `/api/ai/profile` can use a dedicated Groq model setting for onboarding.
- [ ] `/api/ai/domain-weights` can use a dedicated Groq model setting for onboarding.
- [ ] Local fallback still works when Groq is not configured.
- [ ] Groq failures or invalid responses do not hard-break onboarding completion.
- [ ] Existing schema validation remains enforced.
- [ ] Crisis/safety escalation behavior is unchanged.

## Notes

- Suggested owner: `agent-1`
- Suggested worktree: `../Grove-agent-1`
- Main write scope: onboarding AI routes and shared AI provider/config only.
- Non-collision rule: preserve current response contracts so `GRO-002` can proceed in parallel.
- Recommended default: keep fallback behavior and make model selection configurable rather than Groq-required.
