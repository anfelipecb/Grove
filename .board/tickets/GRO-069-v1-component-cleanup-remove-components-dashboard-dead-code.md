---
id: "GRO-069"
title: "V1 component cleanup — remove components/dashboard dead code"
slug: "v1-component-cleanup-remove-components-dashboard-dead-code"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["cleanup", "v2", "refactor"]
depends_on: []
created_at: "2026-05-20T17:00:00.000Z"
updated_at: "2026-05-20T17:00:00.000Z"
---

## Context

`apps/web/src/components/dashboard/` contains 5 v1 component files that predate the v2 rewrite. V2 is the active UI; these files are orphaned dead code. Files to remove: `coach-greeting.tsx`, `coach-suggestions.tsx`, `dashboard-ui.tsx`, `due-label.ts`, `xp-consistency.ts`.

## Acceptance Criteria

- [ ] `grep -r "from.*components/dashboard" apps/web/src` returns no results (or only the files themselves)
- [ ] `apps/web/src/components/dashboard/` directory deleted
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes

## File Map

- Delete: `apps/web/src/components/dashboard/` (all 5 files)

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-069`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-069 <pr-url>`

## Notes

- Run the grep FIRST before deleting — if any import exists, remove it before deleting the file
- Also check `apps/web/src/app/dashboard/page.tsx` — it likely just has `redirect("/today")` with no v1 component imports
