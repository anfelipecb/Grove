---
id: "GRO-040"
title: "Coach chat panel — conversational interface in Coach tab"
slug: "coach-chat-panel-conversational-interface-in-coach-tab"
status: "done"
priority: "p1"
owner: "codex"
branch: "ticket/gro-040-coach-chat-panel-conversational-interface-in-coach-tab"
worktree: ".worktrees/gro-040-coach-chat-panel-conversational-interface-in-coach-tab"
pr_url: "https://github.com/anfelipecb/Grove/pull/26"
labels: []
depends_on: []
created_at: "2026-05-19T23:01:16.125Z"
updated_at: "2026-05-19T23:46:35.500Z"
---

## Context

`/api/ai/mycelium-chat` already exists and supports multi-turn coaching, but it's only exposed on the legacy `/mycelium` route. The Coach tab (`/coach`) is a pure dashboard with no conversational interface. This ticket surfaces the chat as a first-class panel in the Coach tab.

**Layout:**
- Desktop: 2-column — Left = existing `CoachCheckin` dashboard (goals, domain levels, rewards), Right = chat panel
- Mobile: new "Chat" tab alongside existing Coach content
- Chat: message list + text input + send; connects to `/api/ai/mycelium-chat`
- First message pre-seeded as coach-initiated greeting referencing today's top goal
- Chat state persisted in `sessionStorage` (no DB needed for MVP)

## Acceptance Criteria

- [ ] `apps/web/src/components/v2/coach/coach-chat-panel.tsx` created — message list, text input, send button
- [ ] Desktop: right column renders `CoachChatPanel` alongside `CoachCheckin`
- [ ] Mobile: "Chat" tab added to coach tab group
- [ ] Sends `{ messages, context }` to `/api/ai/mycelium-chat`
- [ ] `/api/ai/mycelium-chat` updated to accept optional `context` field in body (active goals, today tasks, recent XP, today's date)
- [ ] Loading state (typing indicator) + error fallback handled
- [ ] First message pre-seeded: coach opening line referencing today's top goal
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/components/v2/coach/coach-chat-panel.tsx`
- Modify: `apps/web/src/app/(v2)/coach/page.tsx`
- Modify: `apps/web/src/app/api/ai/mycelium-chat/route.ts` — accept optional `context` in body

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-040`.
- Work inside the generated `.worktrees/GRO-040-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-040 <pr-url>`.

## Notes

- `mycelium-chat` route already has `CoachDashboardContext` — the new `context` field supplements it with real-time today data
- GRO-042 (return-login debrief) and GRO-043 (journal) both depend on this ticket merging first
