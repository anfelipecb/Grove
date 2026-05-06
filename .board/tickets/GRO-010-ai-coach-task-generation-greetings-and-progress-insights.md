---
id: "GRO-010"
title: "AI coach task generation greetings and progress insights"
slug: "ai-coach-task-generation-greetings-and-progress-insights"
status: "backlog"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["ai", "coach", "tasks", "insights"]
depends_on: ["GRO-009"]
created_at: "2026-05-06T20:58:22.357Z"
updated_at: "2026-05-06T21:05:00.000Z"
---

## Context

Mycelium should help the user stay on track, not just answer a chat prompt. The app needs a coach layer that can greet the user, suggest concrete tasks from conversation, and surface short progress-oriented insights and nudges tied to the personal loop and community context.

## Acceptance Criteria

- [ ] Add an AI-driven greeting or opening state that feels useful when the user opens the app.
- [ ] Allow the coach to suggest concrete tasks from chat context or recent goals.
- [ ] Surface a compact advice/insight pane that helps the user stay organized and reflect on progress.
- [ ] Keep advice short, practical, and non-clinical.
- [ ] Generated task suggestions can be turned into real tasks/goals without manual copy-paste.
- [ ] The new AI surfaces fit inside the solo dashboard and stay compatible with community-aware context.

## Notes

- Scope:
  Mycelium prompt/route updates, task suggestion flow, and compact UI surfaces in the personal layer.
- This ticket will likely touch both server AI routes and dashboard/community entry surfaces.
- Keep the first version simple:
  greeting, suggested next steps, and one actionable advice pane.
