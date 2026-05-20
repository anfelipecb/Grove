---
id: "GRO-044"
title: "Free-form task capture via chat with calendar placement"
slug: "free-form-task-capture-via-chat-with-calendar-placement"
status: "done"
priority: "p2"
owner: "cursor"
branch: "ticket/gro-044-free-form-task-capture-via-chat-with-calendar-placement"
worktree: ".worktrees/gro-044-free-form-task-capture-via-chat-with-calendar-placement"
pr_url: "https://github.com/anfelipecb/Grove/pull/38"
labels: []
depends_on: []
created_at: "2026-05-19T23:01:23.210Z"
updated_at: "2026-05-20T02:58:23.753Z"
---

## Context

Currently adding a task requires filling a structured modal (title, domain, frequency, time-of-day). For ADHD users, the friction of categorizing something mid-flow often kills the intention. This ticket makes the primary "Add task" path a natural-language chat input: the user describes what they need in plain text, the coach parses it, and shows a confirmation card with the task placed on the calendar.

**Flow:**
1. "Add task" button → opens slim chat overlay (single input line)
2. User types: "I need to review my thesis section tonight for 45 minutes"
3. `POST /api/ai/task-from-chat` → Groq balanced → `{ title, domain, duration_minutes, suggested_time: "HH:MM" }`
4. Confirmation card: title badge, domain chip, duration, mini calendar slot
5. "Add it" → POST `/api/v2/tasks` then POST `/api/v2/calendar/schedule`
6. "Quick add (structured)" link still opens the existing `AddTaskModal` as fallback

## Acceptance Criteria

- [ ] `POST /api/ai/task-from-chat` route created — system prompt instructs Groq to return strict JSON `{ title, domain, duration_minutes, suggested_time }`; uses `routedCompletion(..., 'balanced')` from GRO-037
- [ ] `apps/web/src/components/v2/today/task-chat-overlay.tsx` created — chat input + confirmation card + "Add it" / "Quick add" actions
- [ ] "Add task" button in Today daily card opens the overlay (not the modal directly)
- [ ] Confirmation card shows parsed title, domain chip (color-coded), duration, and proposed time
- [ ] "Add it" → sequential: POST `/api/v2/tasks` then POST `/api/v2/calendar/schedule` with `start_time` + `duration_minutes`
- [ ] "Quick add (structured)" → opens existing `AddTaskModal`
- [ ] Overlay is dismissable (Escape key + backdrop click)
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/app/api/ai/task-from-chat/route.ts`
- Create: `apps/web/src/components/v2/today/task-chat-overlay.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` (or today-tabs.tsx) — wire "Add task" to overlay

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-044`.
- Work inside the generated `.worktrees/GRO-044-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-044 <pr-url>`.

## Notes

- GRO-037 must be merged first — `task-from-chat` route uses `routedCompletion`
- Valid domain IDs: import `LIFE_DOMAINS` constant so the AI output is validated before saving
- `suggested_time` format: "HH:MM" (same as `start_time` on scheduled_tasks)
- Fallback: if Groq fails or JSON invalid, auto-open the structured modal instead of showing an error
