---
id: "GRO-056"
title: "Humanize AI-generated goal titles across Goals and Coach and Mycelium"
slug: "humanize-ai-generated-goal-titles-across-goals-and-coach-and-mycelium"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-056-humanize-ai-generated-goal-titles-across-goals-and-coach-and-mycelium"
worktree: ".worktrees/gro-056-humanize-ai-generated-goal-titles-across-goals-and-coach-and-mycelium"
pr_url: "https://github.com/anfelipecb/Grove/pull/42"
labels: []
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:05:04.234Z"
---

## Context

AI-generated goal titles like "Define the next 25-minute action for: Show up in community" appear verbatim on the Goals page, in the Coach nudge, and in Mycelium's opening chat line ("Let's keep Define the next 25-minute action for: Show up in community in view today"). The prompt is leaking task-instruction format into a field that should be a short human goal statement.

**Two-part fix:**
1. Tighten the system prompt in `suggest-goals` route to prohibit task-instruction format.
2. Add a `normalizeGoalTitle()` safety-net function that strips the most common AI-prefix pattern in case the model still misbehaves.

## Acceptance Criteria

- [ ] `apps/web/src/app/api/v2/coach/suggest-goals/route.ts` — system prompt updated to include: "Each `title` must be a 3–7 word human goal statement written from the user's perspective (e.g. 'Show up in community', 'Build a reading habit'). Never output task-instruction format such as 'Define the next X-minute action for:' or 'Do Y every day'."
- [ ] Add `normalizeGoalTitle(raw: string): string` in the route file — strips the pattern `/^Define the next \d+-minute action for:\s*/i` and trims; applied to every suggestion title before returning the response
- [ ] Existing suggestions that already have good titles are unaffected (the regex only strips the specific bad prefix)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/api/v2/coach/suggest-goals/route.ts`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-056`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-056 <pr-url>`

## Notes

- Check if the same bad pattern can come from the v1 `/api/ai/coach-suggestions` route — apply the same normalization there if needed
- The Mycelium opening line is built from `context.topGoalTitle` in `coach-chat-panel.tsx` — it will automatically improve once goal titles are correct in the DB
