---
id: "GRO-059"
title: "Simplify Add task modal — defaults and progressive disclosure"
slug: "simplify-add-task-modal-defaults-and-progressive-disclosure"
status: "done"
priority: "p2"
owner: "cursor"
branch: "ticket/gro-059-simplify-add-task-modal-defaults-and-progressive-disclosure"
worktree: ".worktrees/gro-059-simplify-add-task-modal-defaults-and-progressive-disclosure"
pr_url: "https://github.com/anfelipecb/Grove/pull/48"
labels: []
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:14:38.579Z"
---

## Context

The structured Add Task modal (now the fallback path after GRO-044 chat overlay) requires 7 domain + 3 frequency + 4 time = 14 decisions before submit. For ADHD quick-capture this is too many steps. Since the chat overlay is now the primary path, this modal is the "Quick add (structured)" fallback — but it should still be fast.

**Fix:** Smart defaults + progressive disclosure. Title + submit is all that's required; other fields default sensibly and can be changed by expanding "More options".

## Acceptance Criteria

- [ ] `apps/web/src/components/v2/today/add-task-sheet.tsx` — default `domain` = `localStorage.getItem('grove_last_domain') ?? 'work_build'`; default `frequency` = `'once'`; default `preferred_time` = `'flexible'`
- [ ] Domain, frequency, and time rows collapsed by default behind a "More options ›" toggle; expanded on tap
- [ ] Submit enabled with title non-empty (domain/frequency/time already have defaults — no validation block)
- [ ] On successful save, persist chosen domain to `localStorage.setItem('grove_last_domain', domain)` for next time
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/components/v2/today/add-task-sheet.tsx`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-059`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-059 <pr-url>`

## Notes

- This is P2 — the chat overlay (GRO-044) is already the primary path. Don't block other work on this.
- The "collapsed" state should still show the current selected values as a summary line: "work_build · Once · Flexible ›"
