import type { LifeDomainId } from "./domains";

export type EffortBand = "tiny" | "small" | "medium" | "large" | "deep";
export type ResistanceBand = "low" | "medium" | "high" | "avoidant";
export type ValueBand = "nice" | "important" | "critical";

export type XpInput = {
  effort: EffortBand;
  resistance: ResistanceBand;
  value: ValueBand;
  urgent?: boolean;
  communityContribution?: boolean;
};

export type XpSuggestion = {
  xp: number;
  spendablePoints: number;
  rationale: string;
};

const effortBase: Record<EffortBand, number> = {
  tiny: 10,
  small: 20,
  medium: 40,
  large: 70,
  deep: 100,
};

const resistanceMultiplier: Record<ResistanceBand, number> = {
  low: 1,
  medium: 1.25,
  high: 1.6,
  avoidant: 2,
};

const valueMultiplier: Record<ValueBand, number> = {
  nice: 1,
  important: 1.2,
  critical: 1.45,
};

export const SENIORITY_TIERS = [
  { id: "seed", label: "Seed", minXp: 0 },
  { id: "sprout", label: "Sprout", minXp: 250 },
  { id: "rooted", label: "Rooted", minXp: 750 },
  { id: "steward", label: "Steward", minXp: 1600 },
  { id: "elder", label: "Elder", minXp: 3000 },
] as const;

export type SeniorityTier = (typeof SENIORITY_TIERS)[number];

export function suggestXp(input: XpInput): XpSuggestion {
  const urgencyBonus = input.urgent ? 12 : 0;
  const communityBonus = input.communityContribution ? 20 : 0;
  const raw =
    effortBase[input.effort] *
      resistanceMultiplier[input.resistance] *
      valueMultiplier[input.value] +
    urgencyBonus +
    communityBonus;
  const xp = Math.round(raw / 5) * 5;
  const spendablePoints = Math.max(5, Math.round(xp * 0.25));

  return {
    xp,
    spendablePoints,
    rationale: [
      `${input.effort} effort`,
      `${input.resistance} resistance`,
      `${input.value} value`,
      input.urgent ? "time-sensitive" : null,
      input.communityContribution ? "supports the community" : null,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

export function getSeniorityTier(totalXp: number) {
  return [...SENIORITY_TIERS].reverse().find((tier) => totalXp >= tier.minXp) ?? SENIORITY_TIERS[0];
}

export function getNextSeniorityTier(totalXp: number) {
  return SENIORITY_TIERS.find((tier) => tier.minXp > totalXp) ?? null;
}

export function getSeniorityProgress(totalXp: number): {
  currentTier: SeniorityTier;
  nextTier: SeniorityTier | null;
  progressPercent: number;
  xpIntoTier: number;
  xpToNext: number;
} {
  const currentTier = getSeniorityTier(totalXp);
  const nextTier = getNextSeniorityTier(totalXp);
  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      xpIntoTier: Math.max(0, totalXp - currentTier.minXp),
      xpToNext: 0,
    };
  }

  const span = Math.max(1, nextTier.minXp - currentTier.minXp);
  const xpIntoTier = Math.max(0, totalXp - currentTier.minXp);
  const xpToNext = Math.max(0, nextTier.minXp - totalXp);

  return {
    currentTier,
    nextTier,
    progressPercent: Math.min(100, Math.max(0, Math.round((xpIntoTier / span) * 100))),
    xpIntoTier,
    xpToNext,
  };
}

export type ProgressionSnapshot = {
  totalXp: number;
  streakDays: number;
  activeDaysLast7: number;
  completedGoals: number;
  joinedCommunities: number;
  activeCommitments: number;
  completedCommitments: number;
  savedRewards: number;
};

export type SurpriseUnlock = {
  id: string;
  label: string;
  description: string;
  rewardTitle: string;
  rewardCost: number;
  progressLabel: string;
  remainingLabel: string;
  progressPercent: number;
  unlocked: boolean;
};

type SurpriseDefinition = {
  id: string;
  label: string;
  description: string;
  rewardTitle: string;
  rewardCost: number;
  progress: (snapshot: ProgressionSnapshot) => {
    current: number;
    target: number;
    progressLabel: string;
    remainingLabel: string;
  };
};

const SURPRISE_DEFINITIONS: SurpriseDefinition[] = [
  {
    id: "first-sprout",
    label: "First Sprout",
    description: "Turn your first real bank of follow-through into a deliberate, low-friction treat.",
    rewardTitle: "Unhurried coffee, snack, or equivalent reset",
    rewardCost: 30,
    progress: (snapshot) => {
      const target = 250;
      const current = Math.min(snapshot.totalXp, target);
      const remaining = Math.max(0, target - snapshot.totalXp);
      return {
        current,
        target,
        progressLabel: `${snapshot.totalXp} / ${target} XP`,
        remainingLabel: remaining > 0 ? `${remaining} XP to unlock` : "Unlocked",
      };
    },
  },
  {
    id: "steady-rhythm",
    label: "Steady Rhythm",
    description: "Protect consistency long enough to prove you can re-enter, not just sprint once.",
    rewardTitle: "An evening fully off the hook",
    rewardCost: 40,
    progress: (snapshot) => {
      const target = 3;
      const current = Math.min(snapshot.streakDays, target);
      const remaining = Math.max(0, target - snapshot.streakDays);
      return {
        current,
        target,
        progressLabel: `${snapshot.streakDays} / ${target} streak days`,
        remainingLabel: remaining > 0 ? `${remaining} more day${remaining === 1 ? "" : "s"} in a row` : "Unlocked",
      };
    },
  },
  {
    id: "proof-of-work",
    label: "Proof Of Work",
    description: "A body of completed goals deserves a larger reward than a quick dopamine snack.",
    rewardTitle: "Long-form creative block or intentional small purchase",
    rewardCost: 70,
    progress: (snapshot) => {
      const target = 8;
      const current = Math.min(snapshot.completedGoals, target);
      const remaining = Math.max(0, target - snapshot.completedGoals);
      return {
        current,
        target,
        progressLabel: `${snapshot.completedGoals} / ${target} completed goals`,
        remainingLabel: remaining > 0 ? `${remaining} more completed goal${remaining === 1 ? "" : "s"}` : "Unlocked",
      };
    },
  },
  {
    id: "community-pulse",
    label: "Community Pulse",
    description: "Community participation should unlock something tangible, not just sit in a feed.",
    rewardTitle: "Shared progress ritual or public win post",
    rewardCost: 55,
    progress: (snapshot) => {
      const current =
        Math.min(snapshot.joinedCommunities, 1) +
        Math.min(snapshot.activeCommitments, 1) +
        Math.min(snapshot.completedCommitments, 1);
      const target = 3;
      const remainingParts: string[] = [];
      if (snapshot.joinedCommunities < 1) remainingParts.push("join a community");
      if (snapshot.activeCommitments < 1) remainingParts.push("pick up a commitment");
      if (snapshot.completedCommitments < 1) remainingParts.push("close one commitment");
      return {
        current,
        target,
        progressLabel: `${Math.min(snapshot.joinedCommunities, 1)}/1 joined · ${Math.min(snapshot.activeCommitments, 1)}/1 active · ${Math.min(snapshot.completedCommitments, 1)}/1 completed`,
        remainingLabel: remainingParts.length > 0 ? `Next: ${remainingParts[0]}` : "Unlocked",
      };
    },
  },
];

export function getSurpriseUnlocks(snapshot: ProgressionSnapshot): SurpriseUnlock[] {
  return SURPRISE_DEFINITIONS.map((definition) => {
    const progress = definition.progress(snapshot);
    const unlocked = progress.current >= progress.target;
    const progressPercent =
      progress.target > 0 ? Math.min(100, Math.max(0, Math.round((progress.current / progress.target) * 100))) : 100;

    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      rewardTitle: definition.rewardTitle,
      rewardCost: definition.rewardCost,
      progressLabel: progress.progressLabel,
      remainingLabel: progress.remainingLabel,
      progressPercent,
      unlocked,
    };
  });
}

export function getClosestSurpriseUnlock(snapshot: ProgressionSnapshot): SurpriseUnlock | null {
  const locked = getSurpriseUnlocks(snapshot).filter((unlock) => !unlock.unlocked);
  if (locked.length === 0) {
    return null;
  }

  return locked.reduce((best, current) => {
    if (current.progressPercent > best.progressPercent) {
      return current;
    }
    return best;
  });
}

export type GoalDraft = {
  title: string;
  domain: LifeDomainId;
  subarea?: string;
  dueAt?: string;
  xp: number;
};
