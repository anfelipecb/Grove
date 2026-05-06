---
id: "GRO-010"
title: "AI coach task generation greetings and progress insights"
slug: "ai-coach-task-generation-greetings-and-progress-insights"
status: "done"
priority: "p1"
owner: "agent-2"
branch: "ticket/gro-010-ai-coach-task-generation-greetings-and-progress-insights"
worktree: "../Grove-agent-2"
pr_url: "https://github.com/anfelipecb/Grove/pull/9"
labels: []
depends_on: []
created_at: "2026-05-06T20:58:22.357Z"
updated_at: "2026-05-06T21:59:33.081Z"
---

## Context

Mycelium should help the user stay on track, not just answer a chat prompt. The app needs a coach layer that can greet the user, suggest concrete tasks from conversation, and surface short progress-oriented insights and nudges tied to the personal loop and community context.

GRO-009 shipped a mobile-first solo dashboard (`grove-dashboard.tsx`) with:
- Hero section: static "Hi, {displayName}" + a `summaryBlurb` from focus_notes.
- Consistency panel (streak computed from `xp_events`).
- Next action highlight (first active goal).
- Active goals list with complete-on-tap.
- Recent XP log.
- Sticky aside: "Add target" form + Support panel with calibration CTA.

The existing `/api/ai/mycelium-chat` route already calls Groq with the user's goals, profile, and community commitments. This ticket builds on that infra.

## Acceptance Criteria

- [ ] **AI greeting:** Replace the static hero blurb with a short AI-generated contextual opening (consider time of day, streak/consistency state, last completed goal). Fetch on mount via a new `/api/ai/coach-greeting` route; show the static blurb as fallback while loading or if no GROQ key.
- [ ] **Task suggestions panel:** Add a compact panel (between the consistency panel and the "Next action" box, or as a new aside section) that shows 1–3 AI-suggested next tasks based on active goals, recent completions, and community commitments. Use a new `/api/ai/coach-suggestions` route returning structured JSON: `{ suggestions: { title: string; domain: LifeDomainId; rationale: string }[] }`.
- [ ] **One-tap adopt:** Each suggestion has an "Add" button that pre-fills the "Add target" form (title + domain) so the user can confirm without copy-paste.
- [ ] **Progress insight:** Below or inside the hero, show a 1–2 sentence AI observation about the user's recent progress trend (e.g. "You've logged XP 3 days in a row — your strongest streak this month"). Can share the same coach-greeting call.
- [ ] Keep advice short, practical, and non-clinical. Respect `containsCrisisSignal` in all new AI routes.
- [ ] Graceful degradation: when `GROQ_API_KEY` is missing or in demo mode, show sensible static content or hide AI panels — never error.
- [ ] The new surfaces consume theme tokens from GRO-008 (semantic colors, dark mode).

## Implementation Guidance

- **New routes:**
  - `POST /api/ai/coach-greeting` — takes `{ profileId }`, returns `{ greeting: string; insight?: string }`.
  - `POST /api/ai/coach-suggestions` — takes `{ profileId }`, returns `{ suggestions: [...] }`.
  - Both reuse the `groqText` pattern from `mycelium-chat/route.ts`.
- **Dashboard integration:**
  - In `grove-dashboard.tsx`, add state + `useEffect` fetches for greeting and suggestions.
  - Render a `<CoachGreeting />` sub-component in the hero area.
  - Render a `<CoachSuggestions />` panel in the main column.
  - Wire "Add" button on suggestions to set `title`/`domain` state and scroll the add-form into view.
- **Helpers:** Consider extracting a shared `lib/groq.ts` with the `groqText` function so both mycelium-chat and the new routes share it.
- **Scope boundaries:** Do NOT modify the consistency calculation, XP logic, or theme tokens. Only add new surfaces and routes.

## Notes

- Scope: AI routes, dashboard greeting/suggestions panels, and shared Groq helper.
- Keep the first version simple: greeting, suggested next steps, and one progress insight sentence.
- Demo mode: return canned suggestions (e.g. from `lib/demo-data.ts`) instead of calling Groq.
