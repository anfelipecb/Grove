---
id: "GRO-050"
title: "Granular level system 50 levels and community gate at Sprout"
slug: "granular-level-system-50-levels-and-community-gate-at-sprout"
status: "done"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-050-granular-level-system-50-levels-and-community-gate-at-sprout"
worktree: ".worktrees/gro-050-granular-level-system-50-levels-and-community-gate-at-sprout"
pr_url: "https://github.com/anfelipecb/Grove/pull/32"
labels: []
depends_on: []
created_at: "2026-05-20T00:48:19.252Z"
updated_at: "2026-05-20T01:09:42.009Z"
---

## Context

The 5 seniority tiers have large XP gaps that make early progress feel invisible. This ticket adds 10 sub-levels per tier (50 global levels total) so advancement is granular and satisfying. Community access is currently ungated; adding a Sprout gate (global level 11 = 250 XP) means users build personal momentum before the social layer opens.

**Level math:**
```
Seed   L1–L10:    0–249 XP   (25 XP per level)
Sprout L1–L10:  250–749 XP   (50 XP per level)
Rooted L1–L10:  750–1599 XP  (85 XP per level)
Steward L1–L10: 1600–2999 XP (140 XP per level)
Elder  L1–L10:  3000+ XP     (300 XP per level)
```
Global level = `(tierIndex × 10) + tierLevel`. Level 11 = Sprout L1. Level 50 = Elder L10.

## Acceptance Criteria

- [ ] `packages/core/src/scoring.ts` — add `getGlobalLevel(totalXp: number): { tier: SeniorityTier, tierLevel: number, globalLevel: number, xpIntoLevel: number, xpForLevel: number }`
- [ ] `packages/core/src/scoring.ts` — add `COMMUNITY_UNLOCK_GLOBAL_LEVEL = 11` and `hasCommunityAccess(totalXp: number): boolean`
- [ ] `packages/core/src/scoring.test.ts` — tests: level at 0 XP (Seed L1 = global 1), 249 XP (Seed L10 = global 10), 250 XP (Sprout L1 = global 11), 749 XP (Sprout L10 = global 20), 3000 XP (Elder L1 = global 41)
- [ ] Coach tab seniority display updated to show "Seed · L4" format
- [ ] Community page: if `!hasCommunityAccess(totalXp)`, render a "keep going" screen — progress bar to level 11, message "Community unlocks at Sprout (level 11). You're at level X."
- [ ] Community nav tab: show lock icon overlay for locked users; clicking still navigates (shows the gate screen)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `packages/core/src/scoring.ts`
- Modify: `packages/core/src/scoring.test.ts`
- Modify: `apps/web/src/app/(v2)/community/page.tsx`
- Modify: `apps/web/src/components/v2/coach/coach-checkin.tsx` (or wherever tier label is shown)
- Modify: `apps/web/src/components/v2/layout/v2-nav.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-050`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-050 <pr-url>`

## Notes

- Gate inside the community page server component (has Supabase access already) rather than threading XP through the nav.
- Keep community tab visible in nav — show lock icon, don't hide it. Users should know it exists and is worth reaching.
- Demo note: demo user starts at 0 XP and will see the gate screen — that's intentional and illustrative.
