---
id: "GRO-060"
title: "Community join — handle already-member state gracefully"
slug: "community-join-handle-already-member-state-gracefully"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-060-community-join-handle-already-member-state-gracefully"
worktree: ".worktrees/gro-060-community-join-handle-already-member-state-gracefully"
pr_url: "https://github.com/anfelipecb/Grove/pull/44"
labels: []
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:05:04.816Z"
---

## Context

When a user tries to join a community they're already a member of, the UI shows "You are already a member of this community" styled as a red error — but this is not an error, it's expected state. The Join button also stays enabled, allowing repeated attempts.

**Fix:** Detect already-member state before showing the join form. Show a neutral info message, disable Join, and provide a "Go to community →" navigation link.

## Acceptance Criteria

- [ ] In the community join/entry component (likely `apps/web/src/components/v2/community/community-entry.tsx`): if the current user is already a member, render an info state instead of the join form
- [ ] Info state: neutral styling (`text-muted-foreground`, not `text-destructive`); message "You're already a member of this community"
- [ ] Join button absent or disabled in info state
- [ ] "Go to community →" link navigates to the community feed/home
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/community/community-entry.tsx` (or wherever the already-member check lives — search for the error string)

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-060`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-060 <pr-url>`

## Notes

- The membership check likely already happens (it produces the error message) — this is a UX/styling fix, not a logic change
- The "Go to community" link should navigate to `/community` or directly to the community's feed
