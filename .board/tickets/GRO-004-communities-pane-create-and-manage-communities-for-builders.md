---
id: "GRO-004"
title: "Communities pane: create and manage communities for builders"
slug: "communities-pane-create-and-manage-communities-for-builders"
status: "doing"
priority: "p2"
owner: "agent-1"
branch: "ticket/gro-004-communities-pane-create-and-manage-communities-for-builders"
worktree: "../Grove-agent-1"
pr_url: "https://github.com/anfelipecb/Grove/pull/3"
labels:
  - "communities"
  - "ux"
  - "supabase"
  - "parallel-safe"
depends_on: []
created_at: "2026-05-06T06:05:25.824Z"
updated_at: "2026-05-06T14:30:00.000Z"
---

## Context

The community loop is first-class in Grove, but `/communities` today only lists memberships and shows feed, sessions, and Mycelium. Organizers and builders cannot start a new space or lightly manage one (name, description, visibility of slug) from the pane.

Supabase today: `communities` has **SELECT only** for authenticated users; there is **no INSERT** on `communities`. `memberships` allows **insert self** for joining existing communities. Implementing “create community” requires new **RLS policies and/or a validated API route** plus a safe create path that adds the creator as **`owner`**.

## Scope

- **UI:** [apps/web/src/components/communities-view.tsx](apps/web/src/components/communities-view.tsx) and [apps/web/src/app/communities/page.tsx](apps/web/src/app/communities/page.tsx): add **Create community** (modal or inline form), **Manage** for **owner**/`organizer` on the selected community, and a stronger empty state (CTA to create, not only “complete onboarding”).
- **Data:** Pass **`role`** from `memberships` into each community list item from the server page.
- **Backend:** Migration(s) and/or `apps/web/src/app/api/communities/*` as needed: allow controlled **INSERT** on `communities`, **UPDATE** where the user is owner/organizer via `memberships`, and **creator membership** as `owner` (transaction or two-step with consistent RLS).
- **Out of scope (V1):** email invites, delete community, full moderation, payments, public discovery directory.

**Parallel-safe:** Prefer not editing shared layout/components used by onboarding tickets (`GRO-002`, `GRO-003`) unless coordinated; primary touch: communities route + view + new migration/API.

## Acceptance Criteria

- [ ] **Create community** is visible on `/communities`; on success the new community exists and the user is **owner** and sees it in the sidebar (refresh or optimistic update).
- [ ] **Manage** (or equivalent) for **owner**/**organizer**: at least **edit name and description**; **slug** shown (immutable after create unless you justify otherwise in PR).
- [ ] **RLS/security:** users cannot update communities they do not manage; slug collisions return a clear error.
- [ ] No regression to Clerk auth or onboarding gating on `/communities`.
- [ ] Write scope documented in PR: communities page/view, migrations, any new API routes.

## Notes

- Suggested: claim with `pnpm board:ticket:start GRO-004 agent-1` or `agent-2` after `git pull` in that worktree.
- Apply DB migration on Supabase project when merging.
