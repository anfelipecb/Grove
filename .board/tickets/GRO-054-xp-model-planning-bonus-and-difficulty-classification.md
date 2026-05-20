---
id: "GRO-054"
title: "XP model planning bonus and difficulty classification"
slug: "xp-model-planning-bonus-and-difficulty-classification"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "scoring", "adhd"]
depends_on: []
created_at: "2026-05-20T00:48:19.252Z"
updated_at: "2026-05-20T00:48:19.252Z"
---

## Context

Research basis: Task initiation is neurologically harder than continuation in ADHD brains. Once started, the brain typically keeps going. The current XP model rewards effort × resistance × value — it values completion but does not explicitly reward the planning/initiation step. This ticket adds:

1. **Planning bonus** (+15 XP): tasks tagged as planning get elevated reward for the hardest part.
2. **Difficulty field on tasks**: `low/medium/high` maps to effort bands automatically so users don't have to categorize manually.
3. **Hyperfixation bonus** (+10 XP): tasks belonging to the user's current top active goal get a bonus — keeping the current fixation rewarding.

## Acceptance Criteria

- [ ] `packages/core/src/scoring.ts` — add `PLANNING_BONUS_XP = 15` and `HYPERFIXATION_BONUS_XP = 10` constants
- [ ] `packages/core/src/scoring.ts` — extend `XpInput` with optional `planning?: boolean` and `isHyperfixationGoal?: boolean`; update `suggestXp` to add bonuses when set
- [ ] `packages/core/src/scoring.test.ts` — tests: planning bonus adds 15, hyperfixation bonus adds 10, both stack, neither applies when flags absent
- [ ] Migration `0017_tasks_difficulty.sql` — `ALTER TABLE tasks ADD COLUMN difficulty text CHECK (difficulty IN ('low','medium','high'));` (nullable, no default)
- [ ] `POST /api/v2/tasks` — accepts and stores `difficulty` field
- [ ] `POST /api/xp` — accepts `planning: boolean` and `isHyperfixationGoal: boolean` in body; passes to `suggestXp`
- [ ] Apply migration via Supabase MCP (project `rgiysvoemvznmfvvohzy`)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `packages/core/src/scoring.ts`
- Modify: `packages/core/src/scoring.test.ts`
- Create: `supabase/migrations/0017_tasks_difficulty.sql`
- Modify: `apps/web/src/app/api/v2/tasks/route.ts`
- Modify: `apps/web/src/app/api/xp/route.ts`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-054`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-054 <pr-url>`

## Notes

- GRO-052 (dopamine menu) depends on this ticket being stable — claim GRO-054 first.
- `difficulty` field is nullable — no backfill needed on existing tasks.
- The "hyperfixation goal" = the goal with the most XP events in the last 7 days; the `/api/xp` route can compute this from the `xp_events` table or accept it as a caller-provided boolean.
