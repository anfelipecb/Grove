---
id: "GRO-047"
title: "Today: cut copy density and progressive disclosure on secondary panels"
slug: "today-cut-copy-density-and-progressive-disclosure-on-secondary-panels"
status: "in_review"
priority: "p1"
owner: "cursor"
branch: "ticket/gro-047-today-cut-copy-density-and-progressive-disclosure-on-secondary-panels"
worktree: ".worktrees/gro-047-today-cut-copy-density-and-progressive-disclosure-on-secondary-panels"
pr_url: "https://github.com/anfelipecb/Grove/pull/28"
labels:
  - "v2"
  - "today"
  - "web"
  - "ux"
depends_on: []
created_at: "2026-05-19T23:59:06.878Z"
updated_at: "2026-05-20T00:26:01.116Z"
---

## Context

Stakeholder feedback (May 2026): Today / dashboard has the right components but reads like it is **selling Grove** instead of supporting **the next action**. Multiple panels each explain value (Coach nudge + reason, Community pulse headline + tips + nudges, Find Time explainer, Next Unlocks labels, domain progress, empty-state coaching copy). Result: “proponderance of text” and competing messages.

v2 spec intent: Today is the default **action surface** (tasks today/tomorrow), not a marketing dashboard. Align UI with `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md` — short-term focus, no overwhelming views.

Primary surfaces: `today-desktop.tsx`, `daily-card.tsx`, `community-pulse-card.tsx`, `find-time-panel.tsx`.

## Acceptance Criteria

- [ ] **Tasks are the hero:** Left column / Daily tab leads with task list; secondary widgets do not visually or verbally outweigh unchecked tasks when tasks exist
- [ ] **Coach nudge:** Default shows task title only (one line); `reason` and generic encouragement hidden behind “Why?” / expand or only when nudge is the only content
- [ ] **Community pulse:** Default shows one line (headline or next session); `balanceTips` and multiple `socialNudges` collapsed unless expanded; suggested micro-task remains one clear button
- [ ] **Find Time:** Idle state is label + primary button; remove or shorten instructional paragraph (“Let the coach plan your week…”)
- [ ] **Next unlocks:** Show at most one unlock in summary on Today, or collapse section with count (“2 unlocks in progress”); full list optional on expand or defer to Coach tab
- [ ] **Empty states:** One short line + one primary CTA (add task or Coach); drop secondary explanatory sentences where redundant
- [ ] **Mobile Daily tab:** Same copy rules as desktop; no extra essay blocks on scroll
- [ ] No regression to task complete, add task, drag-and-drop, or API wiring
- [ ] `pnpm typecheck` passes

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-047`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-047 <pr-url>`.

## File Map

- Modify: `apps/web/src/components/v2/today/today-desktop.tsx`
- Modify: `apps/web/src/components/v2/today/daily-card.tsx`
- Modify: `apps/web/src/components/v2/community/community-pulse-card.tsx`
- Modify: `apps/web/src/components/v2/today/find-time-panel.tsx`
- Optional: small shared `CollapsiblePanel` or `ExpandableHint` under `apps/web/src/components/v2/` if it avoids duplication

## Notes

- Out of scope: removing Find Time, Community pulse, or unlocks from the product; this is **density and disclosure**, not feature deletion.
- File collision: GRO-048 touches the same Today files for visual hierarchy; **claim GRO-047 before GRO-048**, or merge 048 after 047 lands.
- Related done tickets: GRO-022 (layout), GRO-032 (pulse wiring), GRO-023 (partial UX clarity).
- **Focus order:** Audit confirms `daily-card.tsx` is already lean (7 non-task text elements). Spend implementation effort on `community-pulse-card.tsx` (8–12 blocks when loaded — primary target) and `find-time-panel.tsx` (instructional paragraph "Let the coach plan your week…" is the main cut). Changes to `daily-card.tsx` should be limited to empty-state copy tightening only.
