---
id: "GRO-011"
title: "Calendar views for personal tasks and community schedules"
slug: "calendar-views-for-personal-tasks-and-community-schedules"
status: "doing"
priority: "p2"
owner: "agent-1"
branch: "ticket/gro-011-calendar-views-for-personal-tasks-and-community-schedules"
worktree: "../Grove-agent-1"
pr_url: "https://github.com/anfelipecb/Grove/pull/8"
labels: []
depends_on: []
created_at: "2026-05-06T20:58:25.007Z"
updated_at: "2026-05-06T21:51:13.966Z"
---

## Context

We need a first-party calendar view so users can assign time to personal goals, see community events in the same product, and reflect on follow-through. This should start as an internal view for tasks and events, with room to add external sync later.

## Acceptance Criteria

- [ ] Add a calendar view for personal tasks/goals and community events/sessions.
- [ ] Users can see scheduled solo work and community time in one coherent planning surface.
- [ ] Tasks/events support clear labels or visual distinctions between solo and community items.
- [ ] The model and UI leave room for future calendar sync without forcing that integration now.
- [ ] The calendar is responsive enough for phone use, even if desktop gets the richer layout first.
- [ ] The experience reinforces the personal loop:
  users can assign time to goals and later use that context for reflection.

## Notes

- Scope:
  calendar route/view, task/event grouping, and basic scheduling presentation.
- Keep external sync out of this first pass.
- Avoid colliding with `GRO-009` by keeping this on a dedicated calendar surface instead of rewriting the main dashboard.
