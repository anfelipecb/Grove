---
id: "GRO-020"
title: "Coach — domain levels profile and rewards shop"
slug: "coach-domain-levels-profile-and-rewards-shop"
status: "backlog"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "coach", "gamification"]
depends_on: ["GRO-019"]
created_at: "2026-05-13T15:43:42.130Z"
updated_at: "2026-05-13T15:43:42.130Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`
Depends on: GRO-019 merged (coach page and tasks exist).

Adds the Profile section to the Coach page: per-domain levels (points earned → level = floor(domainPoints / 100)), progress bars, and the rewards shop. Rewards are private and unlock at domain level thresholds. Use the existing `rewards` table; add `domain` and `unlock_level` columns via migration `0009_v2_rewards_domain_level.sql`.

## Acceptance Criteria

- [ ] Coach page has a "Profile" section below the check-in area
- [ ] Each of the 7 LIFE_DOMAINS shows: name, current level, points to next level, progress bar
- [ ] Domain points are computed by summing `task_completions.points_earned` for tasks with matching `domain`
- [ ] Level = `floor(domainPoints / 100)` (configurable constant, not hardcoded in components)
- [ ] Migration `0009_v2_rewards_domain_level.sql` adds `domain text` and `unlock_level integer default 1` to `rewards`
- [ ] Rewards shop lists the user's rewards grouped by domain, showing lock/unlock status based on current domain level
- [ ] "Add reward" form: title, domain, unlock_level — inserts into `rewards`
- [ ] Locked rewards show points needed to unlock; unlocked rewards show a "Redeem" button (inserts into `reward_redemptions`, deducts `spendable_points`)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/coach/coach-checkin.tsx` — add Profile section below nudge
- Create: `apps/web/src/components/v2/coach/domain-levels.tsx` — 7-domain level grid
- Create: `apps/web/src/components/v2/coach/rewards-shop.tsx` — rewards list + add + redeem
- Create: `supabase/migrations/0009_v2_rewards_domain_level.sql`
- Create: `apps/web/src/app/api/v2/coach/domain-points/route.ts` — GET per-domain point totals

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-020`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-020 <pr-url>`.

## Notes

Migration `0009` must not conflict with `0008` from GRO-016. They touch different tables.
