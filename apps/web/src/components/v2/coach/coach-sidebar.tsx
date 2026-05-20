"use client";

import { useState } from "react";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { CoachWizard } from "@/components/v2/coach/coach-wizard";
import { RewardsShop } from "@/components/v2/coach/rewards-shop";
import type { ExistingCoachGoal } from "@/components/v2/coach/types";

type Props = {
  activeGoals: ExistingCoachGoal[];
  demoMode: boolean;
  displayName: string;
  profileId: string;
  spendablePoints: number;
};

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((domain) => domain.id === domainId)?.label ?? domainId;
}

export function CoachSidebar({ activeGoals, demoMode, displayName, profileId, spendablePoints }: Props) {
  const [editingGoal, setEditingGoal] = useState<ExistingCoachGoal | null>(null);
  const [addingGoal, setAddingGoal] = useState(false);

  if (addingGoal || editingGoal) {
    return (
      <CoachWizard
        demoMode={demoMode}
        editingGoalId={editingGoal?.id ?? null}
        initialDisplayName={displayName}
        initialDomainId={editingGoal?.domain}
        initialStep={editingGoal ? 1 : 0}
        initialUserInput={editingGoal?.title ?? ""}
        onCancel={() => {
          setAddingGoal(false);
          setEditingGoal(null);
        }}
        profileId={profileId}
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border bg-card/95 p-4 shadow-panel dark:shadow-panel-dark">
        <RewardsShop spendablePoints={spendablePoints} collapsed />
      </section>

      <section className="rounded-[28px] border border-border bg-card/95 p-4 shadow-panel dark:shadow-panel-dark">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Goals</p>
          <button
            type="button"
            onClick={() => setAddingGoal(true)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            Add
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {activeGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active goals yet.</p>
          ) : (
            activeGoals.map((goal) => (
              <article
                key={goal.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-background/80 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{goal.title}</h3>
                  <p className="text-xs text-muted-foreground">{domainLabel(goal.domain)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGoal(goal)}
                  className="shrink-0 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Edit
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
