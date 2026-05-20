---
id: "GRO-042"
title: "Return-login coach debrief — daily check-in on new-day login"
slug: "return-login-coach-debrief-daily-check-in-on-new-day-login"
status: "done"
priority: "p2"
owner: "cursor"
branch: "ticket/gro-042-return-login-coach-debrief-daily-check-in-on-new-day-login"
worktree: ".worktrees/gro-042-return-login-coach-debrief-daily-check-in-on-new-day-login"
pr_url: "https://github.com/anfelipecb/Grove/pull/33"
labels: []
depends_on: []
created_at: "2026-05-19T23:01:22.636Z"
updated_at: "2026-05-20T01:09:42.309Z"
---

## Context

After onboarding, new users land on `/today`. But returning users (next day) should start with a coach debrief — a reflection moment before diving into today's tasks. This ticket detects new-day logins client-side and routes to the coach chat with a pre-seeded debrief message.

**How it works:**
- On app load check `localStorage.getItem('grove_last_active')` (ISO date string)
- If date ≠ today → new-day first visit; write today's date to `grove_last_active`
- If landing on `/today` → redirect to `/coach?debrief=1`
- Coach page reads `?debrief=1` → pre-seeds the `CoachChatPanel` with an assistant-turn: "Welcome back. Yesterday you had [N] tasks planned — how did it go?"
- [N] = count from yesterday's task plan (passed as context)

## Acceptance Criteria

- [ ] `apps/web/src/hooks/use-daily-debrief.ts` — reads/writes `grove_last_active`, returns `{ isNewDay: boolean }`
- [ ] `/today` page: on mount, if `isNewDay` → `router.push('/coach?debrief=1')`
- [ ] `/coach` page: reads `?debrief=1` search param → passes debrief opening message as `initialMessage` to `CoachChatPanel`
- [ ] Opening message references yesterday's planned task count (available from today page data)
- [ ] Only redirects once per day (localStorage prevents repeat)
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/hooks/use-daily-debrief.ts`
- Modify: `apps/web/src/app/(v2)/today/page.tsx`
- Modify: `apps/web/src/app/(v2)/coach/page.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-042`.
- Work inside the generated `.worktrees/GRO-042-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-042 <pr-url>`.

## Notes

- GRO-040 must be merged first (CoachChatPanel must exist)
- Use `'client'` component for the hook (localStorage is browser-only)
- The initial coach message should appear as an `assistant` role turn, not `user`, so it reads as coach-initiated
