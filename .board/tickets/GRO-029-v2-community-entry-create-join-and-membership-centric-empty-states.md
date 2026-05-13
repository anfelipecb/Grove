---
id: "GRO-029"
title: "v2 Community entry — create, join, and membership-centric empty states"
slug: "v2-community-entry-create-join-and-membership-centric-empty-states"
status: "done"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: "https://github.com/anfelipecb/Grove/commit/7fbdbea5"
labels:
  - "v2"
  - "community"
  - "parallel-safe"
depends_on: []
created_at: "2026-05-13T21:44:04.356Z"
updated_at: "2026-05-13T23:45:00.000Z"
---

## Context

[GRO-021](GRO-021-community-shared-goals-session-planning-and-member-activity.md) shipped the v2 `/community` home when the user already has a membership. Today [`apps/web/src/app/(v2)/community/page.tsx`](apps/web/src/app/(v2)/community/page.tsx) shows a placeholder (“joining will be available soon”) when there is no membership row.

[GRO-004](GRO-004-communities-pane-create-and-manage-communities-for-builders.md) already implemented **create community** on v1 via [`POST /api/communities`](apps/web/src/app/api/communities/route.ts) (RLS + owner membership). This ticket brings **parity into v2** so users are not forced through `/communities` for basic entry.

Scope stays aligned with the v2 spec: **personal contribution tracking** toward communities the user chooses to foster—not a full multi-space product or discovery directory.

## Scope

- **Join:** Resolve an existing community by **slug** (or invite token later—out of scope) and insert a self `memberships` row with role `member`, respecting existing RLS and duplicate membership behavior.
- **Create:** Call the existing [`POST /api/communities`](apps/web/src/app/api/communities/route.ts) flow from v2 UI (name, slug, description) so the creator becomes **owner**.
- **Empty states:** Replace the placeholder copy with actionable CTAs (join vs create), ADHD-short framing (“pick one group you want to show up for”).
- Prefer **server-validated** join/create via small v2 API routes if the client cannot safely satisfy RLS alone.

## Out of scope

Email invites, moderation, public discovery directory, switching between multiple memberships (still “first membership wins” unless spec updates).

## Acceptance Criteria

- [x] When the user has **no** `memberships` row, `/community` shows **Join** (slug input + submit) and **Create community** (minimal form consistent with v1 validation rules).
- [x] Successful **join** adds membership and reloads into the existing [`CommunityHome`](apps/web/src/components/v2/community/community-home.tsx) experience with correct role-aware UI (organizer vs member).
- [x] Successful **create** uses [`POST /api/communities`](apps/web/src/app/api/communities/route.ts); user lands as **owner** with the same home experience.
- [x] Duplicate slug on create returns a clear inline error (409 mapping); unknown slug on join returns a friendly error.
- [x] No regression to Clerk auth or v2 shell routing.
- [x] `pnpm typecheck` passes.

## File Map

- Modify: [`apps/web/src/app/(v2)/community/page.tsx`](apps/web/src/app/(v2)/community/page.tsx) — replace placeholder with entry UI or delegate to a client wrapper.
- Create: [`apps/web/src/components/v2/community/community-entry.tsx`](apps/web/src/components/v2/community/community-entry.tsx) — join/create forms and optimistic navigation.
- Create: [`apps/web/src/app/api/v2/community/join/route.ts`](apps/web/src/app/api/v2/community/join/route.ts) — `POST` body `{ slug }`, lookup community, insert membership if authorized (or document equivalent server action).
- Reference only (reuse, do not fork creation logic): [`apps/web/src/app/api/communities/route.ts`](apps/web/src/app/api/communities/route.ts).

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-029`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-029 <pr-url>`.

## Notes

**Parallel-safe:** Touch `(v2)/community`, new `components/v2/community/*`, and `api/v2/community/join` first; avoid unrelated Coach/Today files unless coordinating.

**Merged:** Landed on `master` (implementation bundled in [`7fbdbea5`](https://github.com/anfelipecb/Grove/commit/7fbdbea5)). Review: `pnpm typecheck` and `pnpm test` passing at integration time.
