---
id: "GRO-027"
title: "Find Time AI agent — weekly schedule suggestion from profile + goals"
slug: "find-time-ai-agent-weekly-schedule-suggestion-from-profile-goals"
status: "done"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "ai", "scheduling"]
depends_on: ["GRO-025", "GRO-026"]
created_at: "2026-05-13T21:36:06.505Z"
updated_at: "2026-05-13T21:36:06.505Z"
---

## Context

Spec: `docs/superpowers/specs/2026-05-13-task-scheduling-find-time-design.md`

The core value prop of this feature: the user has tasks with life domains and preferred times, and a schedule profile (sleep/work windows). The AI agent looks at all of this and proposes a realistic weekly plan — which tasks on which days and at what time of day — respecting the user's 24 hours.

Example: if the user has a "Sleep hygiene" goal, the agent creates daily tasks (wind-down at 9:30pm, no screens after 10pm) and slots them into the evenings. If the user has "Exercise" it finds their free morning blocks. The output is a proposed schedule the user can accept, edit, or regenerate.

Uses Groq (same pattern as `/api/ai/coach-suggestions`). Input: active tasks + schedule_profile + existing scheduled_tasks this week. Output: array of `{ task_id, date, time_of_day }` assignments for the next 7 days.

## Acceptance Criteria

- [ ] "Find Time" button appears on the Today page (Coach Nudge area or below task list)
- [ ] Clicking opens a loading state, calls `POST /api/ai/find-time` and returns a proposed weekly plan
- [ ] Proposed plan shows as a preview list: each day's tasks grouped by time-of-day block (Morning / Afternoon / Evening)
- [ ] User can accept the full plan (writes all entries to `scheduled_tasks`), or deselect individual items before accepting
- [ ] AI respects `schedule_profile` sleep/work windows — no tasks scheduled during sleep hours or work hours (unless the task domain is work_build)
- [ ] AI respects task `preferred_time` — morning tasks land in morning slots, etc.
- [ ] If `schedule_profile` is missing, AI uses defaults: sleep 22:00–06:30, work 09:00–17:00, flexible free time
- [ ] AI includes sleep hygiene tasks if user has a wellbeing/rest_play goal and no sleep tasks exist yet
- [ ] Regenerate button re-calls the API with a "try a different arrangement" hint
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/app/api/ai/find-time/route.ts` — POST endpoint, calls Groq, returns proposed schedule
- Create: `apps/web/src/components/v2/today/find-time-panel.tsx` — button + loading + proposal preview + accept/edit UI
- Modify: `apps/web/src/components/v2/today/today-desktop.tsx` — add FindTimePanel to right column
- Modify: `apps/web/src/components/v2/today/daily-card.tsx` — add FindTimePanel below task list on mobile
- Modify: `apps/web/src/app/(v2)/today/page.tsx` — pass `scheduleProfile` from profiles to client components

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-027`.
- Work inside the generated worktree.
- After opening the PR, run `pnpm board:ticket:review GRO-027 <pr-url>`.

## Notes

- Groq model: use `GROQ_MODEL` env var (same as other AI routes). Prompt should be structured JSON output.
- The AI response schema: `{ plan: Array<{ task_id: string, task_title: string, date: string, time_of_day: "morning"|"afternoon"|"evening" }> }`
- Cap the plan at 21 items (3 tasks × 7 days) to keep Groq response fast and predictable.
- Sleep hygiene tasks should be auto-created if none exist: insert into `tasks` then include in plan. Suggested titles: "Wind down — no screens", "Consistent bedtime". Domain: `rest_play`. Frequency: `daily`.
- GRO-025 and GRO-026 must be merged first.
