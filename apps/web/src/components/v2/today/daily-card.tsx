"use client";

import { useState, useCallback } from "react";
import { TaskRow, type TaskRowData } from "@/components/v2/today/task-row";
import { LogSessionForm } from "@/components/v2/today/log-session-form";

type DailyCardProps = {
  initialTasks: TaskRowData[];
};

export function DailyCard({ initialTasks }: DailyCardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);

  const required = tasks.filter((t) => t.is_required);
  const goal = tasks.filter((t) => !t.is_required);

  const handleComplete = useCallback(async (id: string) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
    setError(null);

    const res = await fetch(`/api/v2/tasks/${id}/complete`, { method: "POST" });
    if (!res.ok) {
      // Roll back
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not complete task.");
    }
  }, []);

  const handleLog = useCallback(async (title: string, domain: string, notes: string) => {
    setError(null);
    const res = await fetch("/api/v2/tasks/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, domain, notes }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not log session.");
    }
  }, []);

  return (
    <div className="px-4 py-2">
      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {required.length > 0 && (
        <section className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Required by coach</p>
          {required.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </section>
      )}

      {goal.length > 0 && (
        <section className="mb-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your goals</p>
          {goal.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </section>
      )}

      {required.length === 0 && goal.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tasks yet — head to Coach to set up your goals.
        </p>
      )}

      <LogSessionForm onLog={handleLog} />
    </div>
  );
}
