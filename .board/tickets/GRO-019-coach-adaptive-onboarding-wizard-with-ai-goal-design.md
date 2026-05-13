---
id: "GRO-019"
title: "Coach — adaptive onboarding wizard with AI goal design"
slug: "coach-adaptive-onboarding-wizard-with-ai-goal-design"
status: "backlog"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "coach", "ai"]
depends_on: ["GRO-015", "GRO-016"]
created_at: "2026-05-13T15:43:41.836Z"
updated_at: "2026-05-13T15:43:41.836Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`
Depends on: GRO-015 + GRO-016 merged.

The Coach wizard is the first thing a new user sees. It's an adaptive multi-step flow: starts with an open-text question, AI maps the answer to life domains, then walks the user through creating goals and tasks. On completion it populates their first daily card in Today.

Returning users see the Coach page as a check-in and goal redesign space. AI nudge appears at the top.

Reuse the existing Groq AI provider from `packages/core/src/ai-provider.ts`. The new `/api/v2/coach/suggest-goals` route calls Groq with a prompt that takes free-text input + domain and returns 2-3 goal suggestions with tasks.

## Acceptance Criteria

- [ ] `/coach` page detects if user has any `tasks` rows; if none, renders wizard; otherwise renders check-in view
- [ ] Wizard step 1: free-text input "What area of your life do you most want to improve?" + domain suggestion pills (all 7 LIFE_DOMAINS from `@grove/core`)
- [ ] Wizard step 2: AI returns 2–3 goal suggestions for the chosen domain as selectable pills + "Custom…" option (calls `/api/v2/coach/suggest-goals`)
- [ ] Wizard step 3: for each selected goal, shows suggested tasks with frequency (daily/weekly); user can toggle each on/off
- [ ] Wizard step 4: summary — lists all tasks to be created, split into "Required (for consistency)" vs "Goal tasks"; user confirms
- [ ] On confirm: creates `goals` rows + `tasks` rows in Supabase; marks required tasks with `is_required = true`; redirects to `/today`
- [ ] Returning user view: AI nudge card at top; list of active goals with option to "Add goal" or "Edit" (edit reopens wizard at step 2 for that domain)
- [ ] `pnpm typecheck` passes

## File Map

- Modify: `apps/web/src/app/(v2)/coach/page.tsx` — server component, checks tasks count
- Create: `apps/web/src/components/v2/coach/coach-wizard.tsx` — multi-step wizard shell
- Create: `apps/web/src/components/v2/coach/wizard-step-domain.tsx` — step 1: domain picker
- Create: `apps/web/src/components/v2/coach/wizard-step-goals.tsx` — step 2: goal suggestions
- Create: `apps/web/src/components/v2/coach/wizard-step-tasks.tsx` — step 3: task selection
- Create: `apps/web/src/components/v2/coach/wizard-step-confirm.tsx` — step 4: review + confirm
- Create: `apps/web/src/components/v2/coach/coach-checkin.tsx` — returning user view with nudge
- Create: `apps/web/src/app/api/v2/coach/suggest-goals/route.ts` — POST: domain + user input → goal suggestions via Groq

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-019`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-019 <pr-url>`.

## Notes

Can run in parallel with GRO-017 and GRO-021 after GRO-015 + GRO-016 merge.
GRO-020 (domain levels + rewards) is blocked until this merges.
