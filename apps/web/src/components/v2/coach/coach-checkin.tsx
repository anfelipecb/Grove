"use client";

import { useEffect, useState } from "react";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { CoachWizard } from "@/components/v2/coach/coach-wizard";
import type { ExistingCoachGoal } from "@/components/v2/coach/types";

type Props = {
  activeGoals: ExistingCoachGoal[];
  demoMode: boolean;
  displayName: string;
  profileId: string;
};

type GreetingPayload = {
  greeting?: string;
  insight?: string;
};

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((domain) => domain.id === domainId)?.label ?? domainId;
}

export function CoachCheckin({ activeGoals, demoMode, displayName, profileId }: Props) {
  const [editingGoal, setEditingGoal] = useState<ExistingCoachGoal | null>(null);
  const [addingGoal, setAddingGoal] = useState(false);
  const [greeting, setGreeting] = useState(`Welcome back, ${displayName}.`);
  const [insight, setInsight] = useState("Coach is ready to help you refine goals without rebuilding the whole system.");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/ai/coach-greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, demoMode }),
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as GreetingPayload;
        if (cancelled) {
          return;
        }

        if (payload.greeting?.trim()) {
          setGreeting(payload.greeting);
        }

        if (payload.insight?.trim()) {
          setInsight(payload.insight);
        }
      } catch {
        // Keep static fallback copy.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [demoMode, profileId]);

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
    <div className="space-y-5">
      <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Coach nudge</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{insight}</p>
      </section>

      <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Active goals</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Keep what works. Redesign what doesn&apos;t.</h2>
          </div>
          <button
            type="button"
            onClick={() => setAddingGoal(true)}
            className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90"
          >
            Add goal
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {activeGoals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background/80 p-5 text-sm leading-6 text-muted-foreground">
              No active goals yet. Start the wizard to create your first one.
            </div>
          ) : (
            activeGoals.map((goal) => (
              <article
                key={goal.id}
                className="flex flex-col gap-4 rounded-3xl border border-border bg-background/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{domainLabel(goal.domain)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGoal(goal)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
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
