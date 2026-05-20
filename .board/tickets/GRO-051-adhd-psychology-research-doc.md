---
id: "GRO-051"
title: "ADHD psychology research doc"
slug: "adhd-psychology-research-doc"
status: "done"
priority: "p2"
owner: "cursor"
branch: "ticket/gro-051-adhd-psychology-research-doc"
worktree: ".worktrees/gro-051-adhd-psychology-research-doc"
pr_url: "https://github.com/anfelipecb/Grove/pull/35"
labels: []
depends_on: []
created_at: "2026-05-20T00:48:19.252Z"
updated_at: "2026-05-20T02:58:22.905Z"
---

## Context

Grove's feature decisions (dopamine menu, focus sessions, XP model, community gating) should be grounded in ADHD psychology research. This ticket creates a research reference doc in `docs/research/` that all product and engineering decisions can cite.

Research has already been compiled from credible sources (PMC/NIH, JMIR, Journal of Attention Disorders, Psychology Today, ADHD Coaches Organisation). The agent's job is to write the document from this outline.

## Acceptance Criteria

- [ ] `docs/research/adhd-psychology-foundations.md` created with all 8 sections below, each including: key finding, evidence source/citation, and **Grove implication** paragraph
- [ ] Sections:
  1. Task Initiation & Paralysis — prefrontal underactivation; ~67% of ADHD adults affected; smallest-step + body-doubling evidence
  2. Dopamine & the Interest-Based Nervous System — NICE model (Novel/Interesting/Challenging/Urgent); D2/D3 receptor binding differences (PMC 2958516)
  3. Dopamine Menu — coined 2020 by Jessica McCabe + Eric Tivers; appetisers/mains/sides/desserts; reset before return-to-work
  4. Hyperfixation as Motivational Anchor — voluntary (hyperfocus) vs involuntary (hyperfixation); "hyperfixation hangover"; anchor goals to current fixation
  5. Timed Focus Sessions — 10–15 min optimal for ADHD (not 25); visual timers externalize time perception; break = reward not penalty
  6. Context Switching & Transition Rituals — switch-cost amplification; closing/opening micro-ritual externalizes the switch
  7. Gamification Evidence — 48% retention boost (JMIR Serious Games 2022); variable rewards beat fixed; hedonic adaptation pitfall
  8. Planning & Initiation XP — initiation is neurologically harder than continuation; reward the start, not only the finish
- [ ] Document is 600–900 words, plain language, no fluff

## File Map

- Create: `docs/research/adhd-psychology-foundations.md`

## Agent Workflow

- Read `AGENTS.md` before claiming.
- Claim: `pnpm board:ticket:start GRO-051`
- Work in the generated worktree.
- After PR: `pnpm board:ticket:review GRO-051 <pr-url>`

## Notes

- This is documentation only — no code changes.
- `docs/` is in `.gitignore` patterns that exclude class deliverables, but a `research/` subdirectory with markdown is fine to commit (check `.gitignore` and add an exception if needed).
- Tone: practical and direct. Each "Grove implication" should say exactly what design decision the finding supports.
