---
id: "GRO-080"
title: "Today desktop — wire Start focus session and openTaskSelect entry"
slug: "today-desktop-wire-start-focus-session-and-opentaskselect-entry"
status: "done"
priority: "p1"
owner: "cursor"
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/65"
labels: []
depends_on: []
created_at: "2026-05-20T21:57:52.560Z"
updated_at: "2026-05-20T22:04:50.880Z"
---

## Context

**Audit (2026-05-20):** GRO-053 / GRO-074 shipped `FocusSessionOverlay` (`fixed inset-0 z-[100]`, Opal-style full-screen pomodoro) and `useFocusSession` with `openTaskSelect`, pause, 5s end friction. **`TodayDesktop` renders the overlay** when `phase !== "idle"` but **never exposes an entry point** on lg+ breakpoints.

- **Mobile** (`TodayMobileShell` → `DailyCard`): has **"Start focus session"** calling `onStartFocusSession()` → `session.openTaskSelect()`.
- **Desktop** (`TodayDesktop`): only path is **Start → → Schedule + Focus** on a single task (`startWithTasks`). No global **Start focus session** button, no **I'm stuck** / Dopamine menu.

User report: focus mode "got stashed" — code is on `master`; desktop wiring is missing, not deleted.

## Acceptance Criteria

- [ ] `today-desktop.tsx` — add **Start focus session** (ghost/text) in Today task card header, same placement as mobile `daily-card.tsx`; calls `session.openTaskSelect()`.
- [ ] Optional: **I'm stuck** toggles `DopamineMenu` on desktop (parity with mobile) — keep secondary, not competing with task list.
- [ ] `FocusSessionOverlay` still portals full-screen; verify bottom nav hidden under overlay on desktop (`z-[100]`).
- [ ] `Schedule + Focus` from `StartTaskSheet` continues to work (`startWithTasks`).
- [ ] Manual: on `lg` viewport at `/today`, click **Start focus session** → task picker → running timer covers entire viewport.
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Reference: `apps/web/src/components/v2/today/daily-card.tsx` (mobile pattern)
- Reference: `apps/web/src/hooks/use-focus-session.ts` (`openTaskSelect`)
- Reference: `apps/web/src/components/v2/today/focus-session-overlay.tsx`

## Agent Workflow

- Read `AGENTS.md` and UX checklist (task primacy — focus CTA is ghost/secondary).
- Claim: `pnpm board:ticket:start GRO-080`
- Work in worktree only.
- After PR: `pnpm board:ticket:review GRO-080 <pr-url>`

## Notes

- Do not re-implement GRO-053; wire existing hook only.
- Conflicts with GRO-082 if both touch `today-desktop.tsx` task list — claim one at a time or sequence.
