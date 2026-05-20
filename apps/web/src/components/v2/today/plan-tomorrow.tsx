"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { DomainTag } from "@/components/v2/shared/domain-tag";

type ActiveTask = { id: string; title: string; domain: string };

type PlanTomorrowProps = {
  tomorrow: string;
  activeTasks: ActiveTask[];
};

type ScheduledEntry = {
  id: string;
  task_id: string;
  tasks: { title: string; domain: string } | null;
};

export function PlanTomorrow({ tomorrow, activeTasks }: PlanTomorrowProps) {
  const [scheduled, setScheduled] = useState<ScheduledEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    fetch(`/api/v2/calendar/${tomorrow}`)
      .then((r) => r.json())
      .then((d: { scheduled: ScheduledEntry[] }) => setScheduled(d.scheduled ?? []))
      .finally(() => setLoading(false));
  }, [tomorrow]);

  const scheduledIds = new Set(scheduled.map((s) => s.task_id));
  const available = activeTasks.filter((t) => !scheduledIds.has(t.id));

  async function handleAdd() {
    if (!selectedId) return;
    const task = activeTasks.find((t) => t.id === selectedId);
    if (!task) return;

    const optimistic: ScheduledEntry = {
      id: `temp-${Date.now()}`,
      task_id: task.id,
      tasks: { title: task.title, domain: task.domain },
    };
    setScheduled((prev) => [...prev, optimistic]);
    setAdding(false);
    setSelectedId("");

    const res = await fetch("/api/v2/calendar/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task_id: selectedId, date: tomorrow }),
    });
    if (!res.ok) {
      setScheduled((prev) => prev.filter((s) => s.id !== optimistic.id));
    }
  }

  async function handleRemove(entry: ScheduledEntry) {
    setScheduled((prev) => prev.filter((s) => s.id !== entry.id));
    await fetch("/api/v2/calendar/schedule", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task_id: entry.task_id, date: tomorrow }),
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  async function handleStartToday(entry: ScheduledEntry) {
    await fetch("/api/v2/calendar/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task_id: entry.task_id, date: todayStr }),
    });
    await handleRemove(entry);
  }

  const label = new Date(tomorrow + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan for tomorrow</p>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <details className="mb-2">
        <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">?</summary>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Tasks here are not for today. They stay on your list until you start them or move them back.
        </p>
      </details>
      {loading ? (
        <p className="py-2 text-xs text-muted-foreground animate-pulse">Loading…</p>
      ) : (
        <div className="space-y-1">
          {scheduled.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{s.tasks?.title ?? "—"}</p>
                {s.tasks?.domain && (
                  <div className="mt-0.5">
                    <DomainTag domain={s.tasks.domain} />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleStartToday(s)}
                  className="text-xs font-medium text-moss hover:text-moss/80"
                >
                  Start today
                </button>
                <button
                  onClick={() => handleRemove(s)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove from plan"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {adding ? (
            <div className="flex gap-2 pt-1">
              <select
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-moss"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Pick a task…</option>
                {available.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedId}
                className="rounded-md bg-moss px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setSelectedId(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : available.length > 0 ? (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-moss/40 py-2 text-xs text-moss hover:border-moss hover:bg-moss/5 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task for {label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
