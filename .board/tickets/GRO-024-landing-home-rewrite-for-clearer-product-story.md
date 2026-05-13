---
id: "GRO-024"
title: "Landing home rewrite for clearer product story"
slug: "landing-home-rewrite-for-clearer-product-story"
status: "in_review"
priority: "p1"
owner: "codex"
branch: "ticket/gro-024-landing-home-rewrite-for-clearer-product-story"
worktree: ".worktrees/gro-024-landing-home-rewrite-for-clearer-product-story"
pr_url: "https://github.com/anfelipecb/Grove/pull/22"
labels:
  - "marketing"
  - "landing"
  - "web"
  - "design"
depends_on: []
created_at: "2026-05-13T21:00:10.464Z"
updated_at: "2026-05-13T21:12:05.974Z"
---

## Context

The current landing in `apps/web/src/components/landing-experience.tsx` has polish, but it still reads too much like generated product copy and not enough like a clear, human story about what Grove is for. A first-time visitor should understand within a few seconds:

1. what problem Grove helps with
2. what happens when they sign up
3. how Today, Coach, and Community fit together
4. why this is not generic AI productivity software

This rewrite should make the landing feel more authored, more specific, and more emotionally legible for an ADHD-aware audience. Avoid em dashes / double hyphen copy habits. Use motion intentionally, not as decoration. Preserve the current CTA paths (`/sign-in`, `/sign-up`, optional demo links), but improve the narrative and visual clarity around them.

## Acceptance Criteria

- [ ] Hero clearly frames the user problem in plain language before explaining the product
- [ ] Landing explains Grove as a concrete system, not a vague concept: Coach helps shape goals, Today shows the next tasks, Community keeps follow-through social
- [ ] Replace abstract feature-summary sections with a story flow: friction → Grove system → first day in the app → why community matters → CTA
- [ ] Copy feels authored and human; reduce generic AI/product phrasing and make examples more specific
- [ ] Add or refine motion so it supports section transitions or emphasis, not just ambient floating shapes
- [ ] Visual design feels more intentional and less template-like on both mobile and desktop
- [ ] CTA area clearly tells the user what happens next after sign-up
- [ ] Existing auth/demo entry paths still work (`/sign-in`, `/sign-up`, optional demo links)
- [ ] `pnpm typecheck` passes

## Agent Workflow

- Read `AGENTS.md` before claiming the ticket.
- Claim from the repo root with `pnpm board:ticket:start GRO-024`.
- Work inside the generated `.worktrees/<ticket-id>-<slug>` checkout.
- After opening the PR, run `pnpm board:ticket:review GRO-024 <pr-url>`.

## File Map

- Modify: `apps/web/src/components/landing-experience.tsx` — primary landing rewrite
- Modify: `apps/web/src/app/page.tsx` if needed for layout framing only
- Optional create: additional landing-only components under `apps/web/src/components/` if the rewrite benefits from clearer separation

## Notes

Keep the landing grounded in Grove’s actual product shape: Today, Coach, Community, ADHD-aware follow-through, and community reinforcement. Do not drift into generic “AI companion” messaging.
