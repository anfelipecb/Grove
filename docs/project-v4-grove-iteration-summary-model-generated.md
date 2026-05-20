# Project V4 — Grove iteration summary (model-assisted, ticket-backed)

**Author:** Andres (Grove)  
**Window:** **May 15–20, 2026** (board `updated_at` in **UTC**; dense delivery **May 19–20**)  
**Repo:** [https://github.com/anfelipecb/Grove](https://github.com/anfelipecb/Grove)  
**Theme:** Ship the **v2 ADHD redesign** as a coherent product loop — **Today** (tasks first), **Coach** (Mycelium chat + calibration), **Goals** (progress + domains), **Community** — with **less copy**, **progressive disclosure**, and **friction-aware** focus and XP.

This document answers: *“What did you build this week?”* for **Project V4 / this iteration**. It is grounded in [`.board/tickets/`](../.board/tickets/) frontmatter and merged PRs on `master`.

---

## 1. Executive summary (submission-ready)

**Grove** is an ADHD-aware accountability app where personal follow-through and community participation reinforce each other. In this iteration we moved from a broad v2 scaffold to a **usable daily loop**:

- **Today** is the home surface: task primacy, desktop three-column layout, **calendar tab**, **drag tasks to tomorrow**, **Start → schedule on calendar**, and **full-screen focus sessions** (pomodoro-style with pause and intentional end friction).
- **Coach** is now **conversation-first** (Mycelium chat panel), with **return-login debrief**, **post-onboarding briefing**, and **domain levels moved off Coach onto Goals** so the pane stays calm.
- **Goals** is a dedicated route with **progress rings**, **time-of-day task grouping**, **7-day sparklines**, **domain levels**, and **week/month activity tracking** by life domain.
- **Onboarding** was overhauled: multi-intention intake, normalized domain weights, calendar-aware scheduling step, Mycelium intro, wizard UX polish, and a **briefing handoff** before Today.
- **UX bar** was applied across surfaces: outcome-led landing hero, cut secondary copy on Today, dark-mode moss design tokens, humanized AI goal titles, and production fixes (**Find Time** network/timeout).
- **Research & scoring:** ADHD psychology foundations doc; **50-level seniority** progression with community gate at Sprout; XP bonuses for planning difficulty and hyperfixation patterns.

**Throughput (this window):** **44** tickets touched (`updated_at` ≥ 2026-05-15); **42** `done`, **2** `in_review` (GRO-075, GRO-076) at time of writing.

---

## 2. How to read this window

| Source | Role |
|--------|------|
| [`.board/tickets/`](../.board/tickets/) | IDs, titles, `status`, `pr_url`, timestamps |
| `master` git history | Merge commits from **GRO-037** through **GRO-082** |
| `docs/superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md` | North-star v2 spec (routes, principles) |
| `docs/research/adhd-psychology-foundations.md` | Research backing (GRO-051) |

**Note:** Few tickets show `updated_at` on **May 15–18**; most iteration work clusters **May 19–20 UTC**, with **GRO-037–040** closing **May 19** and a large **May 20** batch through **GRO-082**.

---

## 3. What shipped — by product area

### Foundation & AI infrastructure

| ID | Title | Outcome |
|----|--------|---------|
| **GRO-037** | LLM model router — 3-tier Groq selection | Route complexity to appropriate models; safer fallbacks. |
| **GRO-038** | Onboarding v2 — multi-intention intake | Richer intake with contextual domain explanation. |
| **GRO-039** | Goals view — dedicated page | `/goals` with progress cards and task breakdown. |
| **GRO-040** | Coach chat panel | Conversational Mycelium in Coach tab. |
| **GRO-049** | Demo-safe response cache for Groq routes | TTL cache for greeting/suggestions in demo/no-key builds. |

### Today — solo daily loop

| ID | Title | Outcome |
|----|--------|---------|
| **GRO-046** | Landing hero — outcome-led copy | Fewer competing value-prop layers above the fold. |
| **GRO-047** | Today — cut copy on secondary panels | Progressive disclosure on non-task panels. |
| **GRO-048** | Today — visual hierarchy / primary CTA | Color blocking; one strong primary action per region. |
| **GRO-057** | Today empty state — task primacy | Single “Add task” CTA; demote Find Time / community pulse when empty. |
| **GRO-059** | Simplify Add task modal | Sensible defaults; advanced fields collapsed. |
| **GRO-068** | Calendar tab on Today desktop | Week/time-block calendar integrated in desktop layout. |
| **GRO-045** | Week calendar goal labels + progress strip | Goals visible on scheduling surface. |
| **GRO-067** | Fix Find Time network error (production) | Reliable Find Time + LLM timeout handling. |
| **GRO-073** | Task Start → schedule on calendar | Time confirmation sheet; schedule + focus entry. |
| **GRO-080** | Wire Start focus session on desktop | Focus entry from desktop Today. |
| **GRO-081** | Log column — Plan tomorrow split | Overflow handling; separate Plan tomorrow from day log card. |
| **GRO-082** | Drag tasks to tomorrow (desktop) | Completes GRO-028 drop zone on desktop. |

### Focus & ADHD affordances

| ID | Title | Outcome |
|----|--------|---------|
| **GRO-053** | Locked-in focus sessions overlay | Full-screen pomodoro-style blocking UI. |
| **GRO-074** | Focus session pause + 5s end friction | Harder accidental exit; cleaner running state. |
| **GRO-052** | Dopamine menu recovery panel | Understimulation recovery affordance. |
| **GRO-043** | End-of-day journal | Reflection log with coach context. |
| **GRO-044** | Free-form task capture via chat | Natural language task + calendar placement. |
| **GRO-054** | XP planning bonus + difficulty | Rewards planning effort and task difficulty class. |
| **GRO-051** | ADHD psychology research doc | `docs/research/adhd-psychology-foundations.md` for design rationale. |

### Coach & onboarding

| ID | Title | Outcome |
|----|--------|---------|
| **GRO-041** | Calendar-aware onboarding schedule step | Balance advocate + scheduling awareness at intake. |
| **GRO-042** | Return-login coach debrief | New-day redirect into Coach check-in chat. |
| **GRO-055** | Skip CoachWizard when onboarding complete | Check-in instead of re-running full wizard. |
| **GRO-056** | Humanize AI goal titles | `normalizeGoalTitle` + prompt fixes across surfaces. |
| **GRO-058** | Normalize domain weights to 100% | Consistent weight bar in onboarding. |
| **GRO-061** | Onboarding radial gradient polish | Visual/spacing/punctuation pass. |
| **GRO-064** | Onboarding wizard UX overhaul | White bg, stacked domain bar, clearer multi-goal step 5. |
| **GRO-065** | Post-onboarding briefing page | Summary card, Mycelium chat, “Let’s go” into app. |
| **GRO-066** | Dev-mode 401 bypass for onboarding save | Local/demo path to briefing without full Clerk. |
| **GRO-070** | Mycelium intro step 0 + domain info | Coach personality at start; info on weights step. |
| **GRO-077** | Coach pane — remove domain levels | Coach = chat + goals links; levels live on Goals. |

### Goals page (second wave)

| ID | Title | Outcome |
|----|--------|---------|
| **GRO-071** | Time-aware task grouping | Group tasks by current time-of-day on goal cards. |
| **GRO-072** | Extended progress stats + 7-day sparkline | At-a-glance momentum per goal. |
| **GRO-078** | Domain levels section before tracking | Seniority-by-domain visible on Goals first. |
| **GRO-079** | Domain-aware activity tracking | Week and month views of domain activity. |

### Community, progression, design system

| ID | Title | Outcome |
|----|--------|---------|
| **GRO-050** | 50-level progression + Sprout community gate | Granular seniority; community unlock tier. |
| **GRO-060** | Community join — already-member state | Graceful UX when slug already joined. |
| **GRO-062** | Dark mode design refresh | Moss CSS variables, inner glow, warmer cards. |
| **GRO-063** | Domain colors + info tooltip | Readable domain chips in dark mode. |
| **GRO-069** | V1 dashboard dead code cleanup | Removed legacy `components/dashboard` weight. |

### In review (open at summary time)

| ID | Title | PR |
|----|--------|-----|
| **GRO-075** | Landing community — animated plant SVG, less copy | [#63](https://github.com/anfelipecb/Grove/pull/63) |
| **GRO-076** | Task chat fallback prefill — no duplicate title prompt | [#64](https://github.com/anfelipecb/Grove/pull/64) |

---

## 4. “Less is more” — what changed in the product

Aligned with v2 UX principles (see `CLAUDE.md` / board notes):

1. **Tasks win on Today** — empty state, hierarchy, and panel copy demote secondary widgets until the user has tasks.
2. **One primary CTA per region** — filled buttons do not compete in the same column.
3. **Progressive disclosure** — Add task, Find Time, journals, and coach extras default collapsed or behind expand affordances.
4. **Coach calm** — chat-first; heavy progression UI moved to **Goals**.
5. **Specific copy** — outcome-led landing; humanized goal titles; no generic AI-product filler.

---

## 5. Technical highlights (for reviewers)

| Area | Paths / systems |
|------|------------------|
| v2 app routes | `apps/web/src/app/(v2)/today`, `coach`, `goals`, `community`, `profile` |
| Today components | `apps/web/src/components/v2/today/` (desktop layout, focus overlay, daily card) |
| Coach | `coach-chat-panel.tsx`, briefing routes, `coach-greeting` / `coach-briefing` APIs |
| Goals | `goals-view.tsx`, domain tracking, sparklines |
| AI routes | `apps/web/src/app/api/ai/*`, tiered Groq router, demo cache |
| Data | Supabase tasks, completions, XP events, profiles `onboarding_step` |
| Board workflow | `pnpm board:ticket:start` → worktree → PR → `board:ticket:review` → merge → `board:ticket:close` |

**Verification:** `pnpm typecheck`, `pnpm gate:ci`; manual headed Playwright where Clerk is required.

---

## 6. Narrative for “what I did this iteration” (short paragraph)

This iteration I hardened **Grove v2** into a daily ADHD-aware loop: I shipped a **Goals** page and **Coach chat**, rebuilt **onboarding** with a Mycelium briefing handoff, and made **Today** the real home — calendar, focus sessions, drag-to-tomorrow, and schedule-on-start flows. I applied a **less-is-more** UX pass (landing, Today hierarchy, dark mode tokens), added **research-backed** scoring and focus affordances (journal, dopamine menu, XP bonuses), and fixed **production Find Time**. Work was tracked in **46+ board tickets (GRO-037–082)** with parallel agent worktrees and squash-merged PRs to `master`.

---

## 7. Citation block

- **Board:** [`.board/tickets/`](../.board/tickets/) — **GRO-037** through **GRO-082** (May 15–20 window).  
- **Prior iteration summary:** [`2026-05-13-weekly-build-summary-model-generated.md`](./2026-05-13-weekly-build-summary-model-generated.md)  
- **Spec:** [`superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md`](./superpowers/specs/2026-05-13-grove-v2-adhd-redesign.md)  
- **Research:** [`research/adhd-psychology-foundations.md`](./research/adhd-psychology-foundations.md)  
- **Repository:** [https://github.com/anfelipecb/Grove](https://github.com/anfelipecb/Grove)

---

*Model-generated from ticket frontmatter and merge history; adjust course name, dates, or rubric labels as needed.*
