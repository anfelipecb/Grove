---
id: "GRO-043"
title: "End-of-day journal — reflection log with coach context"
slug: "end-of-day-journal-reflection-log-with-coach-context"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "coach", "db"]
depends_on: ["GRO-040"]
created_at: "2026-05-19T23:01:22.923Z"
updated_at: "2026-05-19T23:01:22.923Z"
---

## Context

The coach currently has no memory of how the user's days actually go. A lightweight end-of-day journaling loop gives the coach longitudinal context and helps users with ADHD build a reflection habit. The entry lives inline in the chat panel — no separate modal.

**How it works:**
- After 6pm local time, if no journal entry for today, the coach chat panel shows a soft prompt card: "How did today go? (tap to log)"
- Tapping expands an inline textarea in the chat panel
- On submit: saved to a new `journal_entries` table
- `mycelium-chat` route includes the last 3 journal entries as "User's recent reflections" in its system prompt

## Acceptance Criteria

- [ ] Migration `0016_journal_entries.sql` — table `journal_entries` (id uuid PK, profile_id uuid FK, content text, entry_date text YYYY-MM-DD, mood text nullable, created_at timestamptz); RLS: owner inserts/reads own rows via Clerk `auth.jwt()`
- [ ] `POST /api/v2/journal` — saves entry (upsert on `profile_id + entry_date`)
- [ ] `GET /api/v2/journal?date=YYYY-MM-DD` — returns entry for date or null
- [ ] Coach chat panel: after 6pm, fetches today's entry; if null → shows soft prompt card
- [ ] Prompt card → inline textarea → submit calls POST route → confirmation message appears in chat
- [ ] `mycelium-chat` route updated: fetches last 3 entries, appends to system prompt as "User's recent reflections"
- [ ] Migration applied via Supabase MCP (project `rgiysvoemvznmfvvohzy`)
- [ ] `pnpm typecheck` passes

## File Map

- Create: `supabase/migrations/0016_journal_entries.sql`
- Create: `apps/web/src/app/api/v2/journal/route.ts`
- Modify: `apps/web/src/components/v2/coach/coach-chat-panel.tsx`
- Modify: `apps/web/src/app/api/ai/mycelium-chat/route.ts`

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-043`.
- Work inside the generated `.worktrees/GRO-043-*` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-043 <pr-url>`.

## Notes

- GRO-040 must be merged first (CoachChatPanel must exist)
- Supabase project: `rgiysvoemvznmfvvohzy` — apply migration via `mcp__supabase__apply_migration`
- RLS must use Clerk pattern: `(auth.jwt() ->> 'sub') = profiles.clerk_user_id` join to get profile_id
- Upsert on `(profile_id, entry_date)` unique constraint so users can revise entries
