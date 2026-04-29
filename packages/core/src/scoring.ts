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

export type GoalDraft = {
  title: string;
  domain: LifeDomainId;
  subarea?: string;
  dueAt?: string;
  xp: number;
};

