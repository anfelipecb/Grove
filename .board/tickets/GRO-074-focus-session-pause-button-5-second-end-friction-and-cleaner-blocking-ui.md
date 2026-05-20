---
id: "GRO-074"
title: "Focus session — pause button 5-second end friction and cleaner blocking UI"
slug: "focus-session-pause-button-5-second-end-friction-and-cleaner-blocking-ui"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "focus", "ux"]
depends_on: []
created_at: "2026-05-20T19:00:00.000Z"
updated_at: "2026-05-20T19:00:00.000Z"
---

## Context

GRO-053 shipped a working focus session overlay with 5 phases: `task-select → running → transition → break → done`. Three gaps remain:
1. No pause — only "End" which exits immediately. Users can't step away briefly without ending the session.
2. "End session" has zero friction — a single tap breaks focus. Opal-style: require a 5-second countdown before the app unlocks.
3. The running screen shows too much UI for a focus state. End-screen copy says "End session" — should be "Back to Grove" (positive framing).

## Acceptance Criteria

**A. Pause button and `paused` phase:**
- [ ] `use-focus-session.ts` — add `paused` to the `FocusSession["phase"]` type
- [ ] Transitions: `running → paused` (pauseSession()), `paused → running` (resumeSession()), `paused → ending` (requestEnd())
- [ ] `paused` phase freezes the timer countdown (no `setInterval` ticking while paused)
- [ ] `focus-session-overlay.tsx` — paused screen: large "Paused." text, elapsed time frozen, "Resume" (primary) and "End session" (secondary text link) buttons

**B. End friction — `ending` phase with 5-second countdown:**
- [ ] `use-focus-session.ts` — add `ending` phase; `requestEnd()` transitions to `ending` from `running` or `paused`
- [ ] `ending` phase auto-advances to `done` after 5 seconds via `setInterval` in the overlay component
- [ ] "Continue session" button in `ending` cancels the countdown and returns to previous phase (`running` or `paused`)
- [ ] `focus-session-overlay.tsx` — ending screen: "Ending in {5}..." countdown number, "Continue session" link below

**C. UI cleanup + copy:**
- [ ] Running screen: remove anything not essential. Keep ONLY: timer ring, current task title (large), "Done — next →" primary button, "Pause" secondary button, small "End" text link (no button styling, bottom of screen)
- [ ] Break screen "End session" button → **"Back to Grove"**
- [ ] Done screen "End session" button → **"Back to Grove"**
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/hooks/use-focus-session.ts`
- Modify: `apps/web/src/components/v2/today/focus-session-overlay.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-074`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-074 <pr-url>`

## Notes

- The 5-second countdown in `ending` uses `setInterval` in the overlay component (same pattern as the sprint timer in `running` phase). The `use-focus-session` hook itself doesn't manage the 5s — it just holds the `ending` phase; the overlay component manages the UI countdown and calls `session.confirmEnd()` after 5 seconds.
- Add `confirmEnd()` to the hook that transitions from `ending → done`
- Add `cancelEnd()` to the hook that transitions from `ending → running | paused` (track which phase to return to)
- `pauseSession()` and `resumeSession()` are new hook methods
