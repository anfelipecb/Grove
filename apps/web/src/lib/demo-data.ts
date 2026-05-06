import { LIFE_DOMAINS, suggestXp, type GoalDraft, type LifeDomainId } from "@grove/core";

export const demoProfile = {
  name: "Andres",
  summary:
    "Builder-organizer with high ambition and high context switching. Grove should keep the next concrete action visible and make community follow-through easier to restart.",
  supportStyle: "Brief, structured, non-judgmental",
  seniority: "Sprout",
  totalXp: 420,
};

/** Default domain weights for seeded demo profile (matches onboarding equal split shape). */
export function demoEqualDomainWeights(): Record<LifeDomainId, number> {
  const n = LIFE_DOMAINS.length;
  const base = Math.floor(100 / n);
  const w = {} as Record<LifeDomainId, number>;
  let rem = 100 - base * n;
  LIFE_DOMAINS.forEach((d, i) => {
    w[d.id] = base + (i < rem ? 1 : 0);
  });
  return w;
}

/** `profiles` upsert payload fields used by demo seed (aligns with dashboard copy). */
export function demoProfileRowFields(clerkUserId: string) {
  return {
    clerk_user_id: clerkUserId,
    display_name: demoProfile.name,
    email: "demo@grove.local",
    private_focus_notes: {
      focus_disclosure: "",
      support_style: demoProfile.supportStyle,
    },
    public_support_preferences: {},
    xp_domain_weights: demoEqualDomainWeights(),
  };
}

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

/** Row shape for `goals` insert from static demo goals. */
export function demoGoalInsertsForProfile(profileId: string) {
  return demoGoals.map((g) => ({
    profile_id: profileId,
    title: g.title,
    domain: g.domain,
    subarea: g.subarea,
    xp_value: g.xp,
    status: "active" as const,
  }));
}

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

