---
id: "GRO-065"
title: "Post-onboarding coach briefing page — summary card Mycelium chat and Lets go button"
slug: "post-onboarding-coach-briefing-page-summary-card-mycelium-chat-and-lets-go-button"
status: "ready"
priority: "p1"
owner: ""
branch: ""
worktree: ""
pr_url: ""
labels: ["v2", "onboarding", "coach", "ux"]
depends_on: []
created_at: "2026-05-20T16:00:00.000Z"
updated_at: "2026-05-20T16:00:00.000Z"
---

## Context

After completing the 5-step onboarding wizard, users are redirected directly to `/today` with no warm handoff. This feels abrupt — the user has just shared personal context with Mycelium and gets no acknowledgment. This ticket adds a `/onboarding/done` briefing page that:
1. Summarizes what the user told Mycelium (goals, domains, style)
2. Opens a Mycelium chat pre-seeded with a first message referencing their goals
3. Gives a clear "Let's go →" button to proceed to the app

## Acceptance Criteria

**New page:**
- [ ] `apps/web/src/app/onboarding/done/page.tsx` — reads `searchParams`: `name`, `goals` (repeatable), `style`, `topDomains` (repeatable, format `"domain:pct"`)
- [ ] No auth required on this page (accessible in dev mode); if Clerk is configured, no redirect
- [ ] Renders `<OnboardingBriefing ...>` client component passing the parsed params

**`OnboardingBriefing` component:**
- [ ] Full-page layout, no V2Nav (standalone page — use `min-h-screen flex flex-col`)
- [ ] Header: Grove wordmark + "Here's your plan, {name}." as h1
- [ ] Desktop 2-column / Mobile stacked:
  - **Left — Summary card:** goals as bullet list (max 5), top 2 domains as colored domain badges (`DomainTag` from `components/v2/shared/domain-tag.tsx`), coaching style badge
  - **Right — `CoachChatPanel`** (from `apps/web/src/components/v2/coach/coach-chat-panel.tsx`): pre-seeded `initialAssistantMessage` = `"Based on what you shared, here's what I'm thinking for your first week: {goals joined}. Want me to break any of these into smaller tasks?"`
- [ ] Full-width "Let's go →" button at bottom → `router.push('/today')`
- [ ] `CoachChatPanel` uses `demoMode={true}` since no profileId available at this stage; the `profileId` can be `"onboarding"` as the sessionStorage key

**Wizard redirect:**
- [ ] `onboarding-wizard.tsx` `finishOnboarding()` success path: build URL params from `intake.name`, selected `goalChips`, `intake.supportStyle`, top 2 domains by weight; redirect to `/onboarding/done?name=...&goals=...` instead of `/today`
- [ ] `pnpm typecheck` passes

## File Map

- Create: `apps/web/src/app/onboarding/done/page.tsx`
- Create: `apps/web/src/components/v2/onboarding/onboarding-briefing.tsx`
- Modify: `apps/web/src/components/v2/onboarding/onboarding-wizard.tsx` (change redirect target on success)

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-065`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-065 <pr-url>`

## Notes

- `CoachChatPanel` is at `apps/web/src/components/v2/coach/coach-chat-panel.tsx` — it already accepts `initialAssistantMessage?: string` (added in GRO-042)
- `DomainTag` is at `apps/web/src/components/v2/shared/domain-tag.tsx` — use with `showInfo={false}` (no tooltip needed here)
- The briefing page should be reachable without auth for dev testing — add `/onboarding/done(.*)` to the public routes in `middleware.ts`
- **GRO-066 depends on this page existing** — merge GRO-065 before GRO-066
