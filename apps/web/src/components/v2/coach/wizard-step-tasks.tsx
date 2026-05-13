"use client";

import type { CoachGoalDraft } from "@/components/v2/coach/types";

type Props = {
  error: string | null;
  goals: CoachGoalDraft[];
  onBack: () => void;
  onContinue: () => void;
  onToggleTask: (goalKey: string, taskId: string) => void;
};

export function WizardStepTasks({ error, goals, onBack, onContinue, onToggleTask }: Props) {
  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step 3 of 4</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">Pick the tasks that should make up your system</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Each goal starts with a small set of suggested tasks. Turn off anything that feels noisy or unrealistic.
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {goals.map((goal) => (
          <article key={goal.key} className="rounded-3xl border border-border bg-background/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{goal.rationale}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {goal.domain}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {goal.tasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    task.enabled ? "border-moss/40 bg-moss/10" : "border-border bg-card"
                  }`}
                >
                  <input
                    checked={task.enabled}
                    className="mt-1 h-4 w-4 rounded border-border text-moss focus:ring-moss"
                    onChange={() => onToggleTask(goal.key, task.id)}
                    type="checkbox"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {task.frequency}
                      </span>
                      {task.isRequired ? (
                        <span className="rounded-full bg-moss px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-moss-fg">
                          Required
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{task.pointValue} points when completed</p>
                  </div>
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90"
        >
          Continue to summary
        </button>
      </div>
    </section>
  );
}
