---
id: "GRO-076"
title: "Task chat fallback prefill — no duplicate title prompt"
slug: "task-chat-fallback-prefill-no-duplicate-title-prompt"
status: "in_review"
priority: "p1"
owner: ""
branch: "ticket/gro-076-task-chat-fallback-prefill-no-duplicate-title-prompt"
worktree: ".worktrees/gro-076-task-chat-fallback-prefill-no-duplicate-title-prompt"
pr_url: "https://github.com/anfelipecb/Grove/pull/64"
labels: []
depends_on: []
created_at: "2026-05-20T21:44:06.310Z"
updated_at: "2026-05-20T21:52:59.576Z"
---

## Context

Primary **Add task** opens `TaskChatOverlay` (“Add task in your words” → Continue). When AI parse fails or is unavailable, the overlay calls `onQuickAdd()`, which closes chat and opens `AddTaskSheet` with **empty** title and header **“Add task”** / placeholder **“What do you want to do?”** — so the user must type the same thing twice with no explanation.

**Keep both surfaces:** chat-first capture stays primary; structured `AddTaskSheet` stays the fallback (and intentional “Quick add (structured)” path). Fix the **handoff**, not remove the second sheet.

## Diagnosis (root cause)

1. **`task-chat-overlay.tsx`** — on non-OK response or network error, `handleParse()` calls `onQuickAdd()` with **no** user text passed through:

```ts
if (!res.ok) {
  onQuickAdd();
  return;
}
// catch → onQuickAdd()
```

2. **`/api/ai/task-from-chat`** returns non-OK in common cases:
   - `503` when `GROQ_API_KEY` is unset (local/CI)
   - `422` when JSON parse/validation fails
   - `401` when unauthenticated

3. **Parents** (`today-desktop.tsx`, `daily-card.tsx`) — `onQuickAdd` sets `addPrefill` to `null` and opens sheet:

```ts
onQuickAdd={() => {
  setShowTaskChat(false);
  setAddPrefill(null);
  setShowAddSheet(true);
}}
```

`AddTaskSheet` already supports `initialTitle` / `initialDomain` (used for Community Pulse suggestions) but chat fallback never sets them.

**User-visible bug:** After typing in chat and tapping Continue, they land on a blank structured form that looks like step one again.

## Acceptance Criteria

- [ ] `TaskChatOverlay` `onQuickAdd` accepts optional prefill: `{ title: string; domain?: string }` (at minimum `title` from chat input).
- [ ] On parse failure (`!res.ok` or catch), call `onQuickAdd({ title: message })` — do **not** open an empty sheet.
- [ ] Intentional **“Quick add (structured)”** still opens sheet with no prefill (user chose structured path from scratch).
- [ ] `today-desktop.tsx` and `daily-card.tsx` wire `onQuickAdd` to `setAddPrefill(prefill ?? null)` then `setShowAddSheet(true)` (mirror Community Pulse `onAddSuggested`).
- [ ] When `initialTitle` is set from chat fallback, sheet copy reflects continuation (not a second “add task” moment):
  - Header e.g. **“Finish adding task”** or **“Add details”** (not “Add task”)
  - Placeholder optional/read-only title field pre-filled; user can edit before submit
  - No requirement to re-type what they already said in chat
- [ ] Optional (nice): inline message on sheet when opened from fallback — one line, e.g. “Couldn’t auto-place on calendar — add domain and time, or submit as-is.”
- [ ] Optional: show brief error in chat overlay before transition (e.g. “AI unavailable”) so fallback isn’t silent — still prefill sheet.
- [ ] `pnpm typecheck` passes; manual: type in chat → Continue with AI off or forced 503 → sheet shows same title, one clear step.

## File Map

- Modify: `apps/web/src/components/v2/today/task-chat-overlay.tsx` (`onQuickAdd` signature + failure paths)
- Modify: `apps/web/src/components/v2/today/add-task-sheet.tsx` (continuation header/placeholder when `initialTitle` set)
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-076`
- Work in the generated worktree only.
- After PR: `pnpm board:ticket:review GRO-076 <pr-url>`

## Notes

- Related: GRO-044 (chat primary path), GRO-059 (structured sheet defaults). This ticket is the missing **prefill bridge** between them.
- Do not remove `AddTaskSheet`; user confirmed structured second step should remain for fallback and Quick add.
