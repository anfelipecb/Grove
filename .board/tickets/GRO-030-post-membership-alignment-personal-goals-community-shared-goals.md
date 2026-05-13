---
id: "GRO-030"
title: "Post-membership alignment — personal goals ↔ community shared goals"
slug: "post-membership-alignment-personal-goals-community-shared-goals"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels:
  - "v2"
  - "community"
  - "coach"
depends_on:
  - "GRO-029"
created_at: "2026-05-13T21:44:04.651Z"
updated_at: "2026-05-13T22:10:00.000Z"
---

## Context

After a user joins or creates a community ([GRO-029](GRO-029-v2-community-entry-create-join-and-membership-centric-empty-states.md)), Grove should **prompt once** to connect solo intent with the group so participation does not drift (“out of sight, out of mind”). [GRO-021](GRO-021-community-shared-goals-session-planning-and-member-activity.md) already surfaces **shared goals** (`goals` where `community_id` is set and `is_public`).

The v2 product thesis ([spec](docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md)) includes **dual-contribution tasks**: personal tasks can earn solo domain points and community points when linked appropriately (`tasks.goal_id`, `tasks.community_id`, `tasks.is_community_task` per [`0008_v2_tasks_and_points.sql`](supabase/migrations/0008_v2_tasks_and_points.sql)).

This ticket is **UX + persistence**, not new AI—short modal/stepper the user can skip (“Remind me later” stores a profile flag or local dismissal with server preference if already modeled).

## Scope

- One-shot flow after successful membership acquisition (trigger from `/community` client shell after first load post-join/create, or redirect query flag—implementation choice documented in PR).
- Show community **shared goals** list; user selects **one or more** they want to contribute toward this week.
- Persist alignment by creating **personal** `tasks` rows for this profile with `goal_id` referencing the chosen shared goal(s), `community_id` set, `is_community_task = true`, sensible defaults for `frequency` / `point_value` / `community_point_value` (editable later elsewhere).
- Optional: map one existing **personal goal** (`goals` row with `profile_id` and no `community_id`, or whichever convention v2 Coach uses) by updating linkage—only if it matches current schema and RLS without ambiguity; otherwise ship task-only linking first.

## Out of scope

Full redesign of Coach wizard; AI-generated alignment copy; notifications.

## Acceptance Criteria

- [ ] After membership exists and alignment has **not** been completed/skipped persistently, user sees a **short modal** (≤ ~3 steps) listing shared goals for their community with multi-select.
- [ ] User can **Skip / Remind me later** without blocking `/community` home.
- [ ] On confirm, selected goals produce **active** personal `tasks` tied to those shared goals with `is_community_task = true` and correct `community_id`.
- [ ] If there are **zero** shared goals, modal explains that organizers can add shared goals and offers skip—no dead end.
- [ ] Completing or skipping does not show again until reset (document reset mechanism—profile JSON flag vs dedicated column—minimal migration acceptable if justified).
- [ ] `pnpm typecheck` passes.

## File Map

- Modify: [`apps/web/src/components/v2/community/community-home.tsx`](apps/web/src/components/v2/community/community-home.tsx) — mount alignment modal when appropriate.
- Create: [`apps/web/src/components/v2/community/alignment-modal.tsx`](apps/web/src/components/v2/community/alignment-modal.tsx) — selection UI + skip.
- Create: [`apps/web/src/app/api/v2/community/alignment/route.ts`](apps/web/src/app/api/v2/community/alignment/route.ts) — `POST` applies task inserts / flags completion under server auth (prefer batch insert + validation membership).
- Reference: [`apps/web/src/app/api/v2/tasks/route.ts`](apps/web/src/app/api/v2/tasks/route.ts) — reuse validation patterns from [GRO-025](GRO-025-free-task-add-on-today-title-domain-frequency-time-of-day.md) where applicable.

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-030`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-030 <pr-url>`.

## Notes

Depends on **GRO-029** landing users into `/community` with a membership. Coordinate copy with ADHD-first tone used elsewhere in v2.
