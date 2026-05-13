import type { LifeDomainId } from "@grove/core";

export type CoachTaskFrequency = "daily" | "weekly" | "once";

export type CoachSuggestedTask = {
  title: string;
  frequency: CoachTaskFrequency;
  isRequired: boolean;
  pointValue: number;
};

export type CoachGoalSuggestion = {
  title: string;
  domain: LifeDomainId;
  rationale: string;
  tasks: CoachSuggestedTask[];
};

export type CoachGoalDraft = {
  key: string;
  title: string;
  domain: LifeDomainId;
  rationale: string;
  custom: boolean;
  tasks: Array<CoachSuggestedTask & { id: string; enabled: boolean }>;
};

export type ExistingCoachGoal = {
  id: string;
  title: string;
  domain: LifeDomainId;
};
