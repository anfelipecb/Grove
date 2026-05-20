---
id: "GRO-052"
title: "Dopamine menu understimulation recovery panel"
slug: "dopamine-menu-understimulation-recovery-panel"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "adhd", "ux"]
depends_on: ["GRO-054"]
created_at: "2026-05-20T00:48:19.252Z"
updated_at: "2026-05-20T00:48:19.252Z"
---

## Context

Research basis: GRO-051 documents that the "Dopamine Menu" (coined 2020 by Jessica McCabe + Eric Tivers) is an evidence-based ADHD technique for combating understimulation and getting back on track. It groups reset activities into four tiers: Appetisers (2–5 min), Mains (10–20 min, the actual goal task), Sides (playful/creative), Desserts (rewards after completion).

When a Grove user is stuck — no tasks checked today, sitting idle — rather than showing a blank or guilt-inducing empty state, we surface the Dopamine Menu as an active path back in.

## Acceptance Criteria

- [ ] `apps/web/src/components/v2/today/dopamine-menu.tsx` — collapsible panel with 4 category sections (Appetisers / Main / Sides / Desserts)
- [ ] Appetisers: static list of 5–6 micro-activities (drink a glass of water, 3 deep breaths, stand and stretch, look out a window for 1 min, wash your face)
- [ ] Main: dynamically populated from the user's top active goal's first uncompleted task — "Your main: [task title from top goal]"
- [ ] Sides: 3–4 playful options (doodle for 2 min, play one song you like, step outside)
- [ ] Desserts: 2 reward options (unlocked after completing a Main — "You've earned: take a real break", "Tell someone what you did")
- [ ] Each item has "I did this →" button; clicking it logs XP (Appetiser/Side = 5 XP, Main = uses existing task completion, Dessert = 10 XP) with `reason = "dopamine reset"`
- [ ] Triggered by: "I'm stuck" button on Today daily card (shows even when tasks exist)
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/components/v2/today/dopamine-menu.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` — add "I'm stuck" button + render dopamine-menu panel when open
- Modify: XP logging (use existing `/api/xp` pattern or `task_completions` for the Main item)

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-052`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-052 <pr-url>`

## Notes

- GRO-054 (XP model update) should merge first — the `PLANNING_BONUS_XP` and `HYPERFIXATION_BONUS_XP` constants are in scope, but the main dependency is making sure the XP logging pattern is stable.
- GRO-053 (focus sessions) will reuse the Appetiser list from this component as break-screen content — keep Appetisers as a named export.
- "I'm stuck" button should be subtle (ghost/secondary styling) — it should not imply failure or add to cognitive load.
