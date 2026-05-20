---
id: "GRO-067"
title: "Fix Find Time network error in production"
slug: "fix-find-time-network-error-in-production"
status: "ready"
priority: "p0"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "ai", "bug", "prod"]
depends_on: []
created_at: "2026-05-20T17:00:00.000Z"
updated_at: "2026-05-20T17:00:00.000Z"
---

## Context

"Find time for my tasks" returns "Network error — please try again" in production. Root cause: the find-time route's LLM call may hit Vercel's 10-second serverless timeout, causing Vercel to return an HTML 500 page. `await res.json()` on HTML throws, which is caught as "Network error." Also, unhandled LLM exceptions surface as HTML 500 rather than JSON.

## Acceptance Criteria

- [ ] `apps/web/src/components/v2/today/find-time-panel.tsx` — wrap `await res.json()` in its own try/catch; parse failure shows `"Could not read server response."` instead of "Network error"
- [ ] `find-time-panel.tsx` — non-ok HTTP responses with valid JSON show `data.error`; non-ok with invalid JSON show a fallback message
- [ ] `apps/web/src/app/api/ai/find-time/route.ts` — add `max_tokens: 1200` to the `routedCompletion` call to prevent Vercel timeout
- [ ] `find-time/route.ts` — wrap the `routedCompletion` call in try/catch; on LLM failure return `NextResponse.json({ error: "AI unavailable — try again shortly." }, { status: 503 })` instead of throwing
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/today/find-time-panel.tsx`
- Modify: `apps/web/src/app/api/ai/find-time/route.ts`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-067`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-067 <pr-url>`

## Notes

- The `routedCompletion` call in `find-time/route.ts` is near line 233. Look for `const raw = await routedCompletion(...)`.
- Adding `max_tokens: 1200` to the options object of `routedCompletion` prevents Groq from generating excessively long output that would cause timeout.
- In `find-time-panel.tsx`, the current pattern is `const data = await res.json()` with no error handling. Wrap it: `let data; try { data = await res.json(); } catch { setErrorMsg("Could not read server response."); setStatus("error"); return; }`
