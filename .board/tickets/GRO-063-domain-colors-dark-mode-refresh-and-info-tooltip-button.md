---
id: "GRO-063"
title: "Domain colors dark mode refresh and info tooltip button"
slug: "domain-colors-dark-mode-refresh-and-info-tooltip-button"
status: "ready"
priority: "p2"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "design", "dark-mode", "domains"]
depends_on: []
created_at: "2026-05-20T05:00:00.000Z"
updated_at: "2026-05-20T05:00:00.000Z"
---

## Context

Two improvements to the domain system:

1. **Domain colors in dark mode**: Current domain badges use `bg-{color}-500/10` backgrounds which are nearly invisible in dark mode, and `text-{color}-700` which is too dark on dark surfaces. Need dark-mode-aware variants.

2. **(i) info tooltip**: Users don't know what "Life Admin" or "Work/Build" means. Adding a small ⓘ button to domain badges that shows a one-sentence description + example activities gives context without cluttering the UI.

## Acceptance Criteria

- [ ] `packages/core/src/domains.ts` — add `description: string` field to all 7 domains:
  - `wellbeing`: "Your health, energy, sleep, and daily physical care"
  - `learning`: "Skills, courses, reading, and intellectual growth"
  - `work_build`: "Projects, career, clients, and things you're building"
  - `relationships`: "Family, friends, partners, and meaningful connections"
  - `community`: "Group belonging, volunteering, and showing up for others"
  - `life_admin`: "Logistics, finances, emails, and the tasks that keep life running"
  - `rest_play`: "Recovery, fun, hobbies, and intentional downtime"
- [ ] `apps/web/src/components/v2/shared/domain-tag.tsx` — add `dark:` color variants: `dark:bg-{color}-950/40 dark:text-{color}-400 dark:border-{color}-700/40` (richer bg, softer text in dark)
- [ ] `apps/web/src/components/v2/shared/domain-info-tooltip.tsx` (new) — a `ⓘ` button that shows a popover on hover (desktop) / tap (mobile) with domain name, description, and top 3 examples; popover style: `bg-card/95 backdrop-blur-sm border border-white/[0.08] shadow-lg rounded-2xl p-3 text-sm`
- [ ] `domain-tag.tsx` — accept optional `showInfo?: boolean` prop; when true, render the ⓘ button inline after the badge text
- [ ] ⓘ button shown on: Goals page domain badges, Coach domain levels section
- [ ] `apps/web/src/components/v2/goals/goal-card.tsx` — update `DOMAIN_ACCENTS.soft` to use `dark:` variants matching the domain-tag update
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `packages/core/src/domains.ts`
- Modify: `apps/web/src/components/v2/shared/domain-tag.tsx`
- Create: `apps/web/src/components/v2/shared/domain-info-tooltip.tsx`
- Modify: `apps/web/src/components/v2/goals/goal-card.tsx`
- Modify: `apps/web/src/app/(v2)/goals/page.tsx` or `goal-card.tsx` to pass `showInfo`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-063`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-063 <pr-url>`

## Notes

- No tooltip library installed. Build with `useState` + `onMouseEnter`/`onMouseLeave` on desktop + `onClick` toggle on mobile. Use `relative` positioning on the badge wrapper and `absolute` for the popover.
- GRO-062 changes the CSS variable for `--card` in dark mode — the tooltip's `bg-card/95` will automatically pick up the warm-tinted card color if GRO-062 merged first. Safe to run in parallel; if GRO-062 isn't merged yet, the tooltip will still look fine with the existing dark card color.
- `LIFE_DOMAINS` is exported from `@grove/core` — import in the tooltip to get descriptions without duplication.
