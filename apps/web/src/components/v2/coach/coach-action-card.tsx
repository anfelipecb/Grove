"use client";

import Link from "next/link";
import { useState } from "react";
import type { CoachAction, ProposedGoal } from "@/lib/coach-actions";

type CoachActionCardProps = {
  action: CoachAction;
  demoMode: boolean;
  onDismiss: () => void;
  onSetupComplete?: () => void;
};

function ProposeSetupCard({
  goals,
  demoMode,
  onDismiss,
  onSetupComplete,
}: {
  goals: ProposedGoal[];
  demoMode: boolean;
  onDismiss: () => void;
  onSetupComplete?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (demoMode) {
      onDismiss();
      return;
    }
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/v2/coach/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        goals: goals.map((g) => ({
          title: g.title,
          domain: g.domain,
          tasks: g.tasks.map((t) => ({
            title: t.title,
            frequency: t.frequency,
            isRequired: t.isRequired ?? false,
          })),
        })),
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save.");
      setStatus("error");
      return;
    }
    setStatus("done");
    onSetupComplete?.();
  }

  return (
    <div className="rounded-2xl border border-moss/30 bg-moss/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-moss">Suggested plan</p>
      {goals.map((g) => (
        <div key={g.title} className="mt-2">
          <p className="text-sm font-medium text-foreground">{g.title}</p>
          <ul className="mt-1 space-y-0.5">
            {g.tasks.map((t) => (
              <li key={t.title} className="text-xs text-muted-foreground">
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {status === "done" ? (
        <p className="mt-2 text-xs text-moss">
          Saved.{" "}
          <Link href="/today" className="underline underline-offset-2">
            Open Today
          </Link>
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={status === "saving"}
            onClick={() => void confirm()}
            className="rounded-full bg-moss px-3 py-1.5 text-xs font-semibold text-moss-fg hover:bg-moss/90 disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Add to Today"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export function CoachActionCard({ action, demoMode, onDismiss, onSetupComplete }: CoachActionCardProps) {
  if (action.type === "propose_setup") {
    return (
      <ProposeSetupCard
        goals={action.goals}
        demoMode={demoMode}
        onDismiss={onDismiss}
        onSetupComplete={onSetupComplete}
      />
    );
  }

  if (action.type === "load_check") {
    return (
      <div className="rounded-2xl border border-border bg-background/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Load check</p>
        <p className="mt-1 text-sm text-foreground">{action.suggestion}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {action.activeGoals} goals · {action.openTasksToday} open tasks today
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Got it
        </button>
      </div>
    );
  }

  if (action.type === "suggest_find_time") {
    return (
      <div className="rounded-2xl border border-border bg-background/80 p-3">
        <p className="text-sm text-foreground">Want a week layout from your tasks?</p>
        <Link
          href="/today"
          className="mt-2 inline-block text-xs font-semibold text-moss underline underline-offset-2"
        >
          Find time on Today
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}
