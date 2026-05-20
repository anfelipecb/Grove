---
id: "GRO-049"
title: "Demo-safe response cache for Groq routes"
slug: "demo-safe-response-cache-for-groq-routes"
status: "ready"
priority: "p0"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "ai", "infra", "demo"]
depends_on: []
created_at: "2026-05-20T00:48:19.252Z"
updated_at: "2026-05-20T00:48:19.252Z"
---

## Context

**Demo tomorrow.** No response caching exists — every page load hits Groq fresh. GRO-037 routed `coach-suggestions` to `llama-3.1-70b-versatile` which has a lower free-tier RPM than 8b-instant. Repeated refreshes during a live demo will trigger rate limit errors and break the coach panel silently.

Fix: a module-level TTL cache keyed by `userId + time-bucket` that serves cached responses for deterministic routes (greeting, suggestions) and leaves conversational routes (mycelium-chat) always fresh.

## Acceptance Criteria

- [ ] `apps/web/src/lib/response-cache.ts` created — exports `getOrFetch(key: string, ttlSeconds: number, fn: () => Promise<string>): Promise<string>` backed by a module-level `Map<string, { value: string; expiresAt: number }>`; expired entries are evicted on access
- [ ] `routedCompletion` in `apps/web/src/lib/llm-router.ts` accepts optional `cacheKey?: string`; if provided and non-empty, wraps the Groq call in `getOrFetch`
- [ ] `coach-greeting/route.ts` — passes `cacheKey = \`greeting:${userId}\`` with TTL 600s
- [ ] `coach-suggestions/route.ts` — passes `cacheKey = \`suggestions:${userId}:${Math.floor(Date.now() / 600000)}\`` (10-min rolling bucket)
- [ ] `mycelium-chat/route.ts` — no `cacheKey` (always live)
- [ ] `find-time/route.ts` — no `cacheKey` (user-triggered, should be fresh)
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/lib/response-cache.ts`
- Modify: `apps/web/src/lib/llm-router.ts`
- Modify: `apps/web/src/app/api/ai/coach-greeting/route.ts`
- Modify: `apps/web/src/app/api/ai/coach-suggestions/route.ts`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-049`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-049 <pr-url>`

## Notes

- The cache is in-process (module-level Map). It resets on server restart, which is fine — demo sessions are short.
- Do NOT cache mycelium-chat — conversation state must stay fresh per message.
- Verification: add a `console.log('[cache] HIT greeting:…')` line in getOrFetch so the demo operator can see cache hits in the server log. Remove the log before shipping to prod if desired.
