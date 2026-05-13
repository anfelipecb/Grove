# Grove v2 — ADHD-Focused Redesign Spec

**Date:** 2026-05-13  
**Status:** Draft — pending implementation  
**Branch:** `v2/adhd-redesign` (new, does not touch existing app)  
**Vercel:** New Vercel project for v2 preview — existing production app untouched

---

## Problem Statement

The current Grove app (v1) delivers poorly on user experience because it tries to do too much at once. The dashboard is a 918-line component mixing XP stats, coach greetings, consistency panels, progression, surprise unlocks, active goals, recent XP, and rewards — cognitively overwhelming for the exact users it's meant to help. Life domains exist in the data layer but aren't a first-class UX concept. The AI coach is passive (greetings, suggestions) rather than active (guides goal design). The community and solo layers are present but their relationship is unclear.

---

## Core Design Philosophy

**Two pillars, one system.** Grove is built on two simultaneous ideas:
1. **Solo growth** — personal goals, domain levels, consistency, private reward economy
2. **Community growth** — shared goals, group sessions, collective momentum

These are not separate products. A single task can earn solo domain points *and* community contribution points. The system is the orchestrator that connects them.

**ADHD-first, always.** Every design decision is filtered through: does this reduce friction for someone with ADHD? Short-term temporal focus (today/tomorrow, not month). Required dailies to anchor consistency. Visual progress that gives dopamine. No overwhelming views.

---

## Architecture: 3 Nav Items

On mobile: **Today · Coach · Community**  
On desktop: same 3, but Today expands into a full 3-column dashboard.

The old nav (Dashboard · Calendar · Communities · Onboarding · Mycelium) is replaced entirely.

---

## Module 1: Today

**The default landing screen. Mobile-first.**

### Mobile layout
Two tabs within Today:

**Tab 1 — Daily Card**
- Greeting header with streak + total points + current level
- Section: "Required by coach" — AI-assigned tasks for consistency (e.g. Walk 15 min, Read 10 pages). These are set by the Coach wizard and adjusted over time by the AI.
- Section: "Your goals" — tasks the user has associated with their active goals, each tagged with a domain color (#wellbeing, #learning, #work, etc.)
- Tasks that contribute to community goals are visually marked (different accent color + label "also earns community pts")
- Each task shows point value. Checking it off awards points immediately.
- "Log a session" button — tap to log any activity not pre-listed (title + domain tag + optional notes). The logged entry immediately appears in the Calendar tab under today's accomplishments.

**Tab 2 — Calendar**
- Default view: **Today + Tomorrow** (short-term ADHD focus — not overwhelming)
- Toggle: Day · Week · Month (Day is the default; Week and Month are available but not shown first)
- Today's log: completed tasks shown as entries, each tagged to goal + domain + points earned
- Tomorrow's plan: scheduled tasks from Coach, plus ability to add/drag tasks
- Past days accessible by scrolling back or tapping month toggle
- Each calendar entry shows: task title, domain tag, goal it belongs to, points earned
- Visual distinction: logged (done, solid color) vs planned (dashed border, muted)
- The calendar is an **accomplishment log first**, planner second — ADHD users forget what they did; seeing it builds motivation

### Desktop layout (3 columns)
**Left column:** Today's tasks (required + goals) + domain progress bars with level indicators  
**Center column:** Calendar (month grid + selected day log + tomorrow planning)  
**Right column:** Coach nudge of the day + community pulse + points unlocks visible

Stats row at top of left column: tasks done today / points earned today / streak days

---

## Module 2: Coach

**Where goals are designed and levels lived. The AI orchestrator.**

### Onboarding flow (first-time users)
An adaptive wizard — not a form, not a free-form chat. Starts from the user's own words, then structures them into goals with AI guidance.

1. Open question: "What area of your life do you most want to improve?" (free text + domain suggestion pills)
2. AI maps answer to life domain(s), confirms: "Got it — Wellbeing. Let's set a goal that's actually doable."
3. For each domain selected: suggests 2–3 specific goals as pills + "Custom…" option
4. For each goal: breaks into concrete tasks with suggested frequency (daily/weekly)
5. Separates tasks into: required (coach assigns for consistency baseline) vs chosen (user's own goals)
6. Sets point values per task (weighted by difficulty/frequency)
7. Summary: "Here's your starting system" → user confirms → Today populates with first daily card

This takes ~5 minutes. After completion, onboarding is done — the Coach page becomes a check-in and redesign space.

### Returning user experience
- AI nudges and check-ins appear at top (e.g. "You've been consistent with Wellbeing this week. Want to level up your sleep goal?")
- User can: redesign a goal, add a new domain, adjust required tasks, ask the coach a question
- The interaction is conversational but with structured options — not a blank chat box

### Profile + Levels (lives in Coach)
- Domain levels: each of the 7 life domains has its own level, earned by accumulating points from tasks tagged to that domain
- Progress bars per domain: current points / points to next level
- Levels are personalized to the user's goals — someone focused on Wellbeing + Work will level up those domains faster
- Rewards shop: explicit list of rewards the user defined (or coach suggested) at each level threshold. E.g. "Game night (unlocks at Wellbeing Lv 2)", "Cheat meal (Lv 3)", "Rest day (Lv 4)". These are private.
- Consistency bonuses: maintaining a daily streak multiplies points earned

### Life Domains (7)
Wellbeing · Learning · Work/Build · Relationships · Community · Life Admin · Rest/Play  
Each has a color, level, and progress bar. Each task is tagged to exactly one domain.

---

## Module 3: Community

**Merged with Mycelium. Community tracking and planning — not AI summarizing.**

- Community home: the group (e.g. AgentsForGood) with member list and activity
- Shared goals: goals the whole community is working toward, with progress bars and contributor count
- Member activity: who's been active this week, what tasks they completed, how many community pts earned
- Session planning: create sessions with time/agenda, RSVP tracking, attendance log
- Community points: separate from solo points — earned by completing community-tagged tasks, showing up to sessions, contributing to shared goals
- No AI session summarization (cut from v1 scope for v2 — simplify first)
- The Mycelium "network" concept is preserved as the community identity but simplified to tracking + planning

---

## Points System

**Solo points** → earned by completing any task → flow into domain levels → unlock personal rewards  
**Community points** → earned by tasks tagged as community, session attendance, shared goal contributions → visible to the group (leaderboard)  
**Dual-contribution tasks** → some tasks earn both simultaneously (e.g. working on Grove prototype earns Work/Build solo pts + community goal pts). A task becomes community-tagged when it is linked to a shared community goal during Coach setup or manually via the task edit flow.

Point values are set by the Coach wizard at setup and can be manually adjusted by the user or coach at any time.

Rewards are defined by the user + suggested by coach at onboarding. They are private (solo rewards) or community perks. They unlock at domain level thresholds, not arbitrary point totals — so the game logic is tied to the goal system.

---

## New User Journey

1. First open → Coach wizard (~5 min): pick domains → define goals → set tasks → confirm system
2. Land on **Today — Daily Card**: first required tasks already populated, goal tasks visible
3. Check off tasks throughout the day → earn points
4. Tap Calendar tab → see what was accomplished (builds motivation)
5. End of day → plan tomorrow in Calendar tab
6. Over days: domain levels rise, rewards unlock, coach nudges progression
7. Community tab: join/see group goals, contribute, attend sessions

---

## Responsive Behavior

| Screen | Layout |
|--------|--------|
| Mobile (<768px) | Today: 2-tab card. Coach: single column scroll. Community: single column. Nav: bottom 3-tab bar. |
| Tablet (768–1024px) | Today: 2-column (tasks + calendar). Others: single column with wider cards. |
| Desktop (>1024px) | Today: 3-column dashboard. Coach: 2-column (chat left, profile/levels right). Community: 2-column (feed left, shared goals right). Top nav bar. |

---

## What's Cut vs v1

| v1 Feature | v2 Decision |
|------------|-------------|
| Separate Onboarding nav item | Folded into Coach wizard (first-time only) |
| Mycelium as separate nav item | Merged into Community |
| Surprise unlocks panel | Replaced by explicit Rewards in Coach profile |
| Consistency panel | Replaced by streak indicator in Today header |
| XP terminology | Replaced by "points" — clearer language |
| Communities as separate nav item | Merged into Community module |
| AI session summarization | Cut for v2 — simplify first |
| 5-item nav | Reduced to 3 nav items |

---

## Deployment Strategy

- New git branch: `v2/adhd-redesign`
- Existing `master` branch and production Vercel app untouched
- New Vercel project connected to `v2/adhd-redesign` branch for preview and testing
- v2 is a complete UX rework — not a set of incremental PRs on top of v1

---

## Out of Scope for v2

- AI session summarization (community)
- Peer matching
- Multi-community support
- Community-built agents
- Progress analytics dashboard
- Mobile native app (still web, responsive)
