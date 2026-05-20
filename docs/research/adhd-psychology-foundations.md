# ADHD Psychology Foundations for Grove

*Research compiled May 2026. Sources: PMC/NIH, JMIR Serious Games, Journal of Attention Disorders, Psychology Today, ADHD Coaches Organisation, The Conversation.*

---

## 1. Task Initiation & Paralysis

**Key finding:** ~67% of adults with ADHD report significant difficulty starting tasks even when they know exactly what needs to be done (Journal of Attention Disorders, 2023). The cause is prefrontal cortex underactivation — the brain's "starter motor" doesn't fire on command the way it does for neurotypical brains. This is not laziness; it's a neurological initiation gap.

**Evidence:** The smallest-step intervention (breaking any task into a sub-step of 2 minutes or less) reliably lowers the activation energy enough for the brain to engage. Body doubling (working in the presence of another person, even silently) has consistent moderate-to-strong evidence across multiple studies.

**Grove implication:** "Add task" should produce small, concrete next steps, not project-level goals. The coach's first suggestion should always be the tiniest possible first move. Onboarding goal-to-task breakdown (GRO-038, GRO-041) directly addresses initiation by presenting tasks at the right granularity.

---

## 2. Dopamine & the Interest-Based Nervous System

**Key finding:** The ADHD nervous system is interest-driven, not importance-driven (Hallowell & Ratey; NDI 2024). Motivation reliably fires only when a task is Novel, Interesting, Challenging, or Urgent (the NICE model). Obligation and importance alone don't activate the dopamine reward pathway.

**Evidence:** PET imaging studies show reduced D2/D3 receptor binding in the mesolimbic pathway for ADHD brains (PMC 2958516). This means the same task that feels rewarding to a neurotypical person feels neurologically neutral to an ADHD brain unless one of the NICE triggers is active.

**Grove implication:** Task framing matters. Presenting tasks as "urgent for today" or "novel first step" activates the NICE model. The coach-suggestions system (GRO-037/040) should frame suggestions through urgency and novelty rather than importance. Gamification (XP, unlocks) provides the artificial novelty/reward loop the brain needs.

---

## 3. Dopamine Menu

**Key finding:** The Dopamine Menu is a structured set of pre-planned, dopamine-boosting activities organized into tiers — Appetisers (2–5 min micro-resets), Mains (the real goal task), Sides (playful/creative breaks), and Desserts (post-completion rewards). Coined 2020 by Jessica McCabe (How to ADHD) and Eric Tivers based on clinical ADHD coaching practice.

**Evidence:** The technique addresses the ADHD trap of waiting to "feel motivated" — instead it provides an active, structured path back into engagement. Psychology Today (2024) and The Conversation (2023) report high self-reported effectiveness among ADHD adults; formal RCT data is limited but the technique is widely recommended by ADHD coaches.

**Grove implication:** When a user is stuck (no tasks completed, idle daytime hours), surfacing a Dopamine Menu (GRO-052) gives them an active on-ramp rather than a guilt-inducing empty state. The Main tier anchors the menu to the user's actual goal — it's not escapism, it's a re-entry protocol.

---

## 4. Hyperfixation as Motivational Anchor

**Key finding:** Hyperfixation is the involuntary, intense absorption in a topic or activity — distinct from voluntary hyperfocus (goal-directed deep work). It is driven by a dopamine surge in the mesolimbic pathway (Nature Neuroscience). When hyperfixation is active, ADHD productivity can be extraordinary. When it shifts — the "hyperfixation hangover" — motivation can collapse entirely (Relational Psych Group, 2024).

**Evidence:** The hangover phase is a known clinical pattern: the user abandons previously exciting goals, feels guilt, and struggles to re-engage. The intervention is to anchor goal-setting to the *current* fixation while it's active, with a gentle re-anchor strategy when it shifts.

**Grove implication:** Onboarding should capture the user's current area of interest and anchor initial goals to it (GRO-038 multi-intention intake). The coach should reference the current top goal (hyperfixation anchor) in suggestions and focus sessions. When a goal goes cold (no XP events for 7+ days), the coach should prompt a re-anchor conversation rather than nagging about the old goal.

---

## 5. Timed Focus Sessions

**Key finding:** The standard 25-minute Pomodoro interval is too long for most ADHD brains. The ADHD Coaches Organisation and multiple practitioners recommend 10–15 minute sprints with 5-minute breaks. Visual timers (analog or on-screen countdown ring) externalize time perception — a core ADHD deficit — and significantly reduce time blindness.

**Evidence:** A 2020 systematic review of 18 studies (Journal of Attention Disorders) found moderate-to-strong evidence for timed focus intervals in ADHD productivity. Visual timers specifically outperform audio-only alerts because they make time physically visible throughout the sprint.

**Grove implication:** Focus sessions (GRO-053) should default to 10 or 15 minutes with a visual ring countdown. Breaks should be framed as rewards, not penalties — the break screen shows a Dopamine Menu Appetiser, not a plain pause screen. Sprint length should be configurable (10/15/25/45 min) so users can match their current state.

---

## 6. Context Switching & Transition Rituals

**Key finding:** Task-switching in ADHD incurs a disproportionately high "switch cost" — the brain requires more time and cognitive resources to shift attention than a neurotypical brain. This manifests as inability to stop one task or inability to start the next (Neurosparkhealth). Proactive and reactive cognitive control are both impaired.

**Evidence:** Physical micro-rituals (standing, stretching, brief countdown) externalize the transition and give the brain a concrete signal that the switch is happening. ADDA recommends explicit "closing rituals" (write one sentence summarizing what was just done) and "opening rituals" (read the next task title aloud) to bridge the gap.

**Grove implication:** The focus session transition screen (GRO-053) — "Take a breath. Read the next task title. Begin when ready." — is directly grounded in this research. Between tasks, a 10-second ritual is not just aesthetic; it serves a neurological function. Future: the coach chat (GRO-040) could offer a daily "context switch debrief" at the end of the day.

---

## 7. Gamification Evidence

**Key finding:** Gamified interfaces show 48% higher retention and up to 60% compliance improvement in ADHD populations compared to non-gamified equivalents (JMIR Serious Games, 2022; Frontiers in Education, 2025). Variable rewards (unpredictable unlock timing) sustain engagement longer than fixed schedules.

**Pitfalls:** Hedonic adaptation — if rewards become predictable, they lose motivational power. Pressure-based gamification ("you lost your streak!") can increase anxiety and shame. The game must feel playful, not coercive.

**Grove implication:** Surprise unlocks (already implemented) are the right pattern — variable reward schedule. XP should be confirmed by the user, not imposed (already implemented). The level system (GRO-050) with 50 granular levels provides more frequent dopamine hits from advancement. Avoid punitive streak mechanics; reset streaks gracefully without penalty framing.

---

## 8. Planning & Initiation XP

**Key finding:** In ADHD, the initiation phase consumes more cognitive and emotional energy than the execution phase. Once a task is started, the brain typically continues naturally. The barrier is not the doing — it is the beginning. Rewarding only completion ignores the hardest part of the ADHD experience.

**Evidence:** Task initiation strategies (SaskADHD, 2024) consistently show that breaking the planning step into its own rewarded action increases overall task completion rates. The cognitive work of planning ("break this goal into steps") is real work and should be recognized as such.

**Grove implication:** Tasks tagged as "planning" should receive a bonus XP multiplier (GRO-054 `PLANNING_BONUS_XP = 15`). The coach suggestions (GRO-037) should include planning-type tasks explicitly ("Write out the three steps for X — 15 min"). The dopamine menu Main tier should be framed as "start" rather than "complete" — the first step is the win.
