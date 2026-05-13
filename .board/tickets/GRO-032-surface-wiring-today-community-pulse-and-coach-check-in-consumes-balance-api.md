---
id: "GRO-032"
title: "Surface wiring — Today community pulse and Coach check-in (consumes balance API)"
slug: "surface-wiring-today-community-pulse-and-coach-check-in-consumes-balance-api"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels:
  - "v2"
  - "today"
  - "coach"
  - "community"
depends_on:
  - "GRO-031"
created_at: "2026-05-13T21:44:05.479Z"
updated_at: "2026-05-13T22:10:00.000Z"
---

## Context

[GRO-031](GRO-031-shared-api-coach-context-for-workload-balance-and-social-nudges-v2.md) introduces **`POST /api/v2/coach/community-balance`** (name may vary—follow merged implementation). The v2 spec calls for a **community pulse** adjacent to Today ([spec lines 65–66](docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md)) and recurring Coach **check-ins**. This ticket wires **both surfaces** to the same response contract without duplicating fetch logic.

Optional richness from [GRO-030](GRO-030-post-membership-alignment-personal-goals-community-shared-goals.md) (alignment-derived tasks) improves suggestions but is **not required** for basic rendering—handle empty/minimal payloads gracefully.

## Scope

- **Today:** Add a compact **Community pulse** module:
  - Desktop: aligns with [`today-desktop.tsx`](apps/web/src/components/v2/today/today-desktop.tsx) right-column expectations or documented alternate placement consistent with layout work ([GRO-022](GRO-022-today-responsive-desktop-3-column-dashboard-layout.md)).
  - Mobile: lighter strip or card inside [`today-tabs.tsx`](apps/web/src/components/v2/today/today-tabs.tsx) / [`daily-card.tsx`](apps/web/src/components/v2/today/daily-card.tsx)—avoid crowding the daily checklist.
  - Shows headline + balance tip + next social touchpoint; optional button “Add suggested micro-task” that opens [`add-task-sheet.tsx`](apps/web/src/components/v2/today/add-task-sheet.tsx) pre-filled when response includes safe defaults (title/domain/frequency—reuse existing props patterns).
- **Coach:** Extend [`coach-checkin.tsx`](apps/web/src/components/v2/coach/coach-checkin.tsx) or adjacent shell with a card summarizing the same API payload (different framing—reflective vs actionable).

Shared hook or server fetch helper (`useCommunityBalance` / `loadCommunityBalance`) lives once under [`apps/web/src/components/v2/`](apps/web/src/components/v2/) or [`apps/web/src/lib/`](apps/web/src/lib/).

## Out of scope

Real-time polling/WebSockets; toast spam; rewriting full Coach wizard.

## Acceptance Criteria

- [ ] Today fetches balance payload **once per relevant mount** (or cached SWR-style within session) with loading + non-blocking error state (small muted message—does not break Today).
- [ ] Coach shows the related card with consistent numeric/date formatting for upcoming sessions.
- [ ] When user has **no** community membership, both surfaces hide or show a **single** gentle prompt linking to `/community` (align copy with [GRO-029](GRO-029-v2-community-entry-create-join-and-membership-centric-empty-states.md)).
- [ ] Pre-fill flow for suggested micro-task does **not** bypass validation on [`POST /api/v2/tasks`](apps/web/src/app/api/v2/tasks/route.ts).
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: [`apps/web/src/components/v2/today/today-desktop.tsx`](apps/web/src/components/v2/today/today-desktop.tsx)
- Modify: [`apps/web/src/components/v2/today/today-tabs.tsx`](apps/web/src/components/v2/today/today-tabs.tsx) and/or [`daily-card.tsx`](apps/web/src/components/v2/today/daily-card.tsx)
- Modify: [`apps/web/src/components/v2/coach/coach-checkin.tsx`](apps/web/src/components/v2/coach/coach-checkin.tsx)
- Create: [`apps/web/src/components/v2/community/community-pulse-card.tsx`](apps/web/src/components/v2/community/community-pulse-card.tsx) — presentation-only component consumed by Today + Coach where practical.
- Reference endpoint from [GRO-031](GRO-031-shared-api-coach-context-for-workload-balance-and-social-nudges-v2.md).

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-032`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-032 <pr-url>`.

## Notes

Coordinate layout overlap with any active Today desktop ticket—comment in PR if rebasing on newer layout commits.
