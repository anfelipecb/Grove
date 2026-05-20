---
id: "GRO-053"
title: "Locked-in focus sessions full-screen pomodoro overlay"
slug: "locked-in-focus-sessions-full-screen-pomodoro-overlay"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "adhd", "focus"]
depends_on: ["GRO-052"]
created_at: "2026-05-20T00:48:19.252Z"
updated_at: "2026-05-20T00:48:19.252Z"
---

## Context

Research basis: ADHD brains benefit from 10–15 min focused sprints with visual timers (vs 25-min Pomodoro). Context switching is disproportionately costly — micro-rituals at task transitions help. A clean, nav-free screen removes ambient distraction.

This ticket adds a full-screen focus session overlay to Today: user selects 1–3 tasks, picks a sprint length, and enters a locked-in surface with only the timer, current task, and an escape hatch visible. Between tasks, a 10-second transition ritual plays. After the sprint, a break screen with a Dopamine Menu Appetiser appears.

## Acceptance Criteria

- [ ] `apps/web/src/hooks/use-focus-session.ts` — state machine: `idle → task-select → running → transition → break → done`; manages timer countdown, current task index, sprint count
- [ ] `apps/web/src/components/v2/today/focus-session-overlay.tsx` — `position: fixed, inset: 0, z-50`; hides v2-nav; clean dark surface showing: sprint timer (visual ring + countdown), current task title, "Done — next task →" button, "End session" escape
- [ ] Timer presets: 10 / 15 / 25 / 45 min (user picks before starting)
- [ ] Task selection: a quick multi-select sheet on Today ("Pick 1–3 tasks to focus on") before the session starts
- [ ] Transition screen (10 seconds): shown when user marks task done mid-session; displays a context-switch micro-prompt ("Take a breath. Read the next task title. Begin when ready."); auto-advances after 10s
- [ ] Break screen: 5-min countdown + one random Appetiser from `DopamineMenu` Appetisers (exported from GRO-052 component); "Skip break" available
- [ ] Completing a task during session calls existing task-completion endpoint
- [ ] On session end (all tasks done or manually ended): log XP — `20 XP × number of completed sprints`; show session summary ("You completed N tasks in X min")
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/hooks/use-focus-session.ts`
- Create: `apps/web/src/components/v2/today/focus-session-overlay.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` — "Start focus session" button
- Modify: `apps/web/src/app/(v2)/today/page.tsx` — render overlay when session state is active

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-053`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-053 <pr-url>`

## Notes

- GRO-052 must merge first — imports `APPETISERS` array from `dopamine-menu.tsx` for the break screen.
- The overlay must hide the bottom nav and header — use a React Portal or `position: fixed inset-0 z-[100]` to ensure it covers all nav elements.
- "End session" should always be one tap away — never trap the user.
- Sprint timer uses `setInterval` in the hook; clear on unmount.
