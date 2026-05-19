---
id: "GRO-037"
title: "LLM model router — 3-tier Groq model selection"
slug: "llm-model-router-3-tier-groq-model-selection"
status: "done"
priority: "p1"
owner: "codex"
branch: "ticket/gro-037-llm-model-router-3-tier-groq-model-selection"
worktree: ".worktrees/gro-037-llm-model-router-3-tier-groq-model-selection"
pr_url: "https://github.com/anfelipecb/Grove/pull/25"
labels: []
depends_on: []
created_at: "2026-05-19T23:01:15.226Z"
updated_at: "2026-05-19T23:25:12.581Z"
---

## Context

Every AI call in Grove currently uses `llama-3.1-8b-instant` regardless of complexity. Greetings and nudges don't need a 70b model; multi-turn coaching and goal planning deserve one. This ticket adds a single shared router that routes by tier so complex tasks get better models and simple tasks stay cheap.

## Acceptance Criteria

- [ ] `apps/web/src/lib/llm-router.ts` — exports `routedCompletion(messages, tier: 'fast'|'balanced'|'deep', opts?)` wrapping the existing Groq fetch pattern
- [ ] Tier map: `fast = llama-3.1-8b-instant`, `balanced = llama-3.1-70b-versatile`, `deep = llama-3.3-70b-versatile`
- [ ] coach-greeting → `fast`
- [ ] coach-suggestions → `balanced`
- [ ] mycelium-chat → `deep`
- [ ] find-time → `balanced`
- [ ] domain-weights → `fast`
- [ ] Context compression: fast-tier calls drop `xpEvents` and `focusNotesRaw` from the prompt body
- [ ] `GROQ_MODEL` env var still overrides all tiers (preserves existing escape hatch)
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/lib/llm-router.ts`
- Modify: `apps/web/src/app/api/ai/coach-greeting/route.ts`
- Modify: `apps/web/src/app/api/ai/coach-suggestions/route.ts`
- Modify: `apps/web/src/app/api/ai/mycelium-chat/route.ts`
- Modify: `apps/web/src/app/api/ai/find-time/route.ts`
- Modify: `apps/web/src/app/api/ai/domain-weights/route.ts`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-037`.
- Work inside the generated `.worktrees/GRO-037-llm-model-router-3-tier-groq-model-selection` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-037 <pr-url>`.

## Notes

- The existing Groq fetch pattern lives in each route file; `llm-router.ts` should extract and centralize it.
- `GROQ_MODEL` env var check: if set, use its value for all tiers unchanged.
- No UI changes — pure backend infra.
