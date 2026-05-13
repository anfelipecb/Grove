---
id: "GRO-021"
title: "Community — shared goals session planning and member activity"
slug: "community-shared-goals-session-planning-and-member-activity"
status: "done"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/pull/19"
labels: ["v2", "community"]
depends_on: ["GRO-015", "GRO-016"]
created_at: "2026-05-13T15:43:42.422Z"
updated_at: "2026-05-13T18:30:11.902Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`
Depends on: GRO-015 + GRO-016 merged. Can run in parallel with GRO-017 and GRO-019.

The Community module merges the old Communities and Mycelium nav items into one focused page. No AI session summarization in v2 — just tracking and planning. Uses existing `communities`, `memberships`, `goals` (community goals), `sessions`, `attendance` tables from the schema.

Community points are separate from solo points. They come from `task_completions.community_points_earned` (set when `tasks.is_community_task = true`) plus session attendance.

## Acceptance Criteria

- [ ] `/community` page shows the user's first community (or a "Join a community" CTA if none)
- [ ] Community home shows: community name, member count, list of shared goals (`goals` where `community_id` is set + `is_public = true`)
- [ ] Each shared goal shows: title, contributor count (distinct `task_completions` for tasks linked to that goal), progress bar (completions this week / members)
- [ ] Member activity section: lists members sorted by `community_points` desc this week, showing name, tasks done, community pts
- [ ] Session planning: list of upcoming `sessions` with RSVP button (inserts/updates `attendance`); "Create session" form for organizers (role = owner/organizer in `memberships`)
- [ ] Community points tally visible in the header (from `profiles.community_points`)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/(v2)/community/page.tsx` — server component, loads community data
- Create: `apps/web/src/components/v2/community/community-home.tsx` — main client component
- Create: `apps/web/src/components/v2/community/shared-goals-list.tsx` — community goals + progress
- Create: `apps/web/src/components/v2/community/member-activity.tsx` — leaderboard
- Create: `apps/web/src/components/v2/community/sessions-panel.tsx` — upcoming sessions + RSVP
- Create: `apps/web/src/app/api/v2/community/route.ts` — GET community data for current user

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-021`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-021 <pr-url>`.

## Notes

Touches only `app/(v2)/community/` and `components/v2/community/` — no overlap with GRO-017 or GRO-019.
