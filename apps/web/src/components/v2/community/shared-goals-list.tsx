"use client";

import { twMerge } from "tailwind-merge";
import { DomainTag } from "@/components/v2/shared/domain-tag";

export type SharedGoal = {
  id: string;
  title: string;
  domain: string;
  contributorCount: number;
  weeklyCompletions: number;
};

type Props = {
  goals: SharedGoal[];
  memberCount: number;
};

export function SharedGoalsList({ goals, memberCount }: Props) {
  if (goals.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
        No shared goals yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const denominator = Math.max(memberCount, 1);
        const pct = Math.min(Math.round((goal.weeklyCompletions / denominator) * 100), 100);
        return (
          <div key={goal.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground leading-snug">{goal.title}</p>
              <DomainTag domain={goal.domain} className="shrink-0" />
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-moss transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{goal.contributorCount} contributor{goal.contributorCount !== 1 ? "s" : ""}</span>
              <span>{goal.weeklyCompletions} completion{goal.weeklyCompletions !== 1 ? "s" : ""} this week</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
