"use client";

import { GoogleCalendarConnect } from "@/components/v2/profile/google-calendar-connect";
import type { CoachGoalDraft } from "@/components/v2/coach/types";

type Props = {
  error: string | null;
  goals: CoachGoalDraft[];
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function WizardStepConfirm({ error, goals, submitting, onBack, onConfirm }: Props) {
  const requiredTasks = goals.flatMap((goal) =>
    goal.tasks
      .filter((task) => task.enabled && task.isRequired)
      .map((task) => ({ goalTitle: goal.title, ...task })),
  );
  const goalTasks = goals.flatMap((goal) =>
    goal.tasks
      .filter((task) => task.enabled && !task.isRequired)
      .map((task) => ({ goalTitle: goal.title, ...task })),
  );

  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step 4 of 4</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">Here&apos;s your starting system</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Confirm the tasks Coach should create. Required tasks anchor consistency; goal tasks move your chosen targets
        forward.
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-border bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Required (for consistency)</h3>
            <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moss-fg">
              {requiredTasks.length}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {requiredTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No required tasks selected yet.</p>
            ) : (
              requiredTasks.map((task) => (
                <div key={`${task.goalTitle}-${task.title}`} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.goalTitle} · {task.frequency} · {task.pointValue} points
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Goal tasks</h3>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {goalTasks.length}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {goalTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goal tasks selected yet.</p>
            ) : (
              goalTasks.map((task) => (
                <div key={`${task.goalTitle}-${task.title}`} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.goalTitle} · {task.frequency} · {task.pointValue} points
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-5">
        <GoogleCalendarConnect connected={false} />
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating your system..." : "Create goals and tasks"}
        </button>
      </div>
    </section>
  );
}
