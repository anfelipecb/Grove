---
id: "GRO-014"
title: "Add user stats progression and unlockable rewards"
slug: "add-user-stats-progression-and-unlockable-rewards"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: []
depends_on: []
created_at: "2026-05-06T23:47:53.291Z"
updated_at: "2026-05-06T23:48:50.000Z"
---

## Context

The personal loop currently shows useful basics like total XP, spendable points, active goals, and consistency, but it does not yet turn progress into a clearer long-term progression system. Grove should not become generic gamified productivity, but users should be able to feel momentum through stats, seniority-style progression, and occasional unlockable rewards or surprises that acknowledge effort over time.

This ticket is about making progress more visible and more motivating without drifting into RPG language. Grove uses seniority tiers, not classic levels, and the progression system should still reflect both personal follow-through and community participation.

## Acceptance Criteria

- [ ] Define and implement a first version of user progression using seniority-tier language rather than RPG levels.
- [ ] Add a user stats surface that makes progress easier to read at a glance. It should include a clear mix of personal and community signals, such as total XP, consistency/streak, completed goals, participation, or similar high-signal metrics.
- [ ] Introduce unlockable rewards/surprises tied to meaningful milestones so users can earn something over time beyond raw point totals.
- [ ] Unlock logic is understandable and grounded in Grove behavior. Avoid opaque gamification or purely cosmetic noise.
- [ ] The dashboard or profile area communicates "what unlocks next" clearly enough to motivate follow-through.
- [ ] Any new copy or naming stays aligned with Grove's tone: encouraging, practical, and not juvenile.
- [ ] Mobile and desktop both support the new progression surface cleanly.

## Implementation Guidance

- Build from the existing `profiles`, `xp_events`, `goals`, `memberships`, `commitments`, and `rewards` concepts before inventing a parallel system.
- Review [apps/web/src/app/dashboard/page.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/app/dashboard/page.tsx), [apps/web/src/components/grove-dashboard.tsx](/Users/anfelipecb/projects/Grove/apps/web/src/components/grove-dashboard.tsx), [apps/web/src/components/dashboard/xp-consistency.ts](/Users/anfelipecb/projects/Grove/apps/web/src/components/dashboard/xp-consistency.ts), and the existing `rewards` schema in [supabase/migrations/0001_initial_schema.sql](/Users/anfelipecb/projects/Grove/supabase/migrations/0001_initial_schema.sql).
- Decide early which signals are derived-only and which need persistence or new schema support.
- Keep the first release simple. A few clear stats and milestone unlocks are better than a sprawling achievement system.

## Notes

- Scope:
  progression model, stats surface, milestone unlocks, and reward visibility.
- Out of scope:
  a full badge marketplace, loot-box style mechanics, or generic productivity streak spam.
- File collision risk:
  medium around dashboard/profile surfaces and potentially high if schema changes are needed for persistent unlock state.
