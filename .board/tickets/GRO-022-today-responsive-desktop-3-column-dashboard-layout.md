---
id: "GRO-022"
title: "Today — responsive desktop 3-column dashboard layout"
slug: "today-responsive-desktop-3-column-dashboard-layout"
status: "backlog"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "today", "desktop"]
depends_on: ["GRO-017", "GRO-018"]
created_at: "2026-05-13T15:43:42.710Z"
updated_at: "2026-05-13T15:43:42.710Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`
Depends on: GRO-017 + GRO-018 merged (Daily Card and Calendar tab both working).

On desktop (≥1024px) the Today page expands from 2-tab mobile layout into a 3-column dashboard: tasks + domain progress bars left, calendar center, coach nudge + community pulse + points unlocks right. The mobile 2-tab layout remains unchanged for <1024px.

Stats row at the top of the left column: tasks done today / points earned today / streak.

## Acceptance Criteria

- [ ] At ≥1024px, `/today` renders 3 columns side by side (no tabs)
- [ ] Left column: stats row (done/pts/streak) + required tasks + goal tasks + domain progress bars (7 domains, points/level each)
- [ ] Center column: calendar (day log for selected date + plan tomorrow)
- [ ] Right column: coach nudge of the day (latest unread nudge from `nudges` table, or AI-generated if none) + community pulse (member count active this week + next session) + points unlocks (next 2 locked rewards)
- [ ] At <1024px the layout collapses back to the 2-tab mobile card — existing behavior unchanged
- [ ] Tablet (768–1023px): 2-column layout (left + center only; right col hidden)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/(v2)/today/page.tsx` — pass domain points + nudge + community pulse as props
- Create: `apps/web/src/components/v2/today/today-desktop.tsx` — 3-column grid (renders at ≥1024px)
- Modify: `apps/web/src/components/v2/today/today-tabs.tsx` — wrap with responsive: show desktop at lg, tabs at sm/md
- Create: `apps/web/src/components/v2/today/domain-progress-bars.tsx` — 7-domain progress list
- Create: `apps/web/src/components/v2/today/today-stats-row.tsx` — done/pts/streak 3-up

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-022`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-022 <pr-url>`.

## Notes

Purely a layout/responsive ticket — no new API routes needed. Reuses data already loaded by the Today page server component.
