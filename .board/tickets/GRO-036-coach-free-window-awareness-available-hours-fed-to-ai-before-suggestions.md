---
id: "GRO-036"
title: "Coach free-window awareness — available hours fed to AI before suggestions"
slug: "coach-free-window-awareness-available-hours-fed-to-ai-before-suggestions"
status: "done"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "ai", "coach"]
depends_on: ["GRO-034", "GRO-035"]
created_at: "2026-05-13T22:55:00.000Z"
updated_at: "2026-05-13T22:55:00.000Z"
---

## Context

Spec + full implementation plan: `docs/superpowers/plans/2026-05-13-time-aware-scheduling.md`

The AI coach currently generates task suggestions without knowing the user's real availability. It might suggest "do a 2-hour deep work session" when the user only has 30 minutes free today. This ticket makes the coach genuinely schedule-aware by computing free windows (using the `computeFreeWindows()` helper from GRO-034) and injecting them into every coach prompt.

**What the coach learns:**
- Total free hours this week
- Free minutes available today  
- Specific free windows today (e.g., "14:00–15:30")
- Whether Google Calendar shows back-to-back meetings

With this context, the coach can say "you have 45 free minutes this afternoon — here's a single focused task" instead of overwhelming suggestions.

## Acceptance Criteria

- [ ] `computeFreeWindows()` imported from `apps/web/src/lib/free-windows.ts` in the coach-suggestions route
- [ ] Free window summary injected into the coach AI prompt (total free hours, today's free minutes, today's windows)
- [ ] Google Calendar events fetched and included in window calculation when token exists
- [ ] Coach suggestions are smaller/fewer when free time is tight (validate manually by setting a very busy schedule)
- [ ] No breaking change to the coach-suggestions response shape (`{ suggestions: [...] }`)
- [ ] Graceful fallback when no schedule_profile or no Google Calendar token (skips window calc, prompt unchanged)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/api/ai/coach-suggestions/route.ts` — import free-windows, compute summary, inject into prompt

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-036`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-036 <pr-url>`

## Notes

- GRO-034 must be merged first (creates `apps/web/src/lib/free-windows.ts`)
- This is a single-file change — small ticket, high impact
- The coach-suggestions route is at `apps/web/src/app/api/ai/coach-suggestions/route.ts`
- The `schedule_profile` field is already on `profiles` (from GRO-026) — select it alongside the existing profile data
- The full prompt injection code is in the plan doc
