import { suggestXp, type GoalDraft } from "@grove/core";

export const demoProfile = {
  name: "Andres",
  summary:
    "Builder-organizer with high ambition and high context switching. Grove should keep the next concrete action visible and make community follow-through easier to restart.",
  supportStyle: "Brief, structured, non-judgmental",
  seniority: "Sprout",
  totalXp: 420,
};

export const demoGoals: GoalDraft[] = [
  {
    title: "Ship Grove repo scaffold",
    domain: "work_build",
    subarea: "Grove",
    dueAt: "Today",
    xp: suggestXp({
      effort: "medium",
      resistance: "medium",
      value: "critical",
      urgent: true,
    }).xp,
  },
  {
    title: "Move for 20 minutes",
    domain: "wellbeing",
    subarea: "Exercise",
    dueAt: "Tonight",
    xp: suggestXp({
      effort: "small",
      resistance: "high",
      value: "important",
    }).xp,
  },
  {
    title: "Share next AgentsForGood agenda",
    domain: "community",
    subarea: "Sessions",
    dueAt: "Friday",
    xp: suggestXp({
      effort: "small",
      resistance: "medium",
      value: "important",
      communityContribution: true,
    }).xp,
  },
];

export const communityFeed = [
  {
    kind: "Session",
    title: "AgentsForGood build night",
    body: "Mycelium captured three commitments: local model demo, onboarding survey review, and Grove feedback.",
    points: 45,
  },
  {
    kind: "Win",
    title: "First onboarding profile drafted",
    body: "A new member got a concrete first target instead of a vague learning path.",
    points: 30,
  },
  {
    kind: "Resource",
    title: "Implementation intentions overview",
    body: "Useful research basis for converting vague intentions into if-then plans.",
    points: 15,
  },
];

