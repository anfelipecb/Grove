"use client";

import { useState } from "react";
import { CalendarClock, RefreshCw, Check, X } from "lucide-react";

type PlanItem = {
  task_id: string;
  task_title: string;
  date: string;
  start_time: string;
  duration_minutes: number;
};

function groupByDate(plan: PlanItem[]): { date: string; items: PlanItem[] }[] {
  const map = new Map<string, PlanItem[]>();
  for (const item of plan) {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date)!.push(item);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function FindTimePanel() {
  const [status, setStatus] = useState<"idle" | "loading" | "preview" | "accepting" | "done" | "error">("idle");
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchPlan(regenerate = false) {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/find-time", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      const data = (await res.json()) as { plan?: PlanItem[]; error?: string };
      if (!res.ok || !data.plan) {
        setErrorMsg(data.error ?? "Could not generate schedule.");
        setStatus("error");
        return;
      }
      setPlan(data.plan);
      setSelected(new Set(data.plan.map((_, i) => String(i))));
      setStatus("preview");
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  async function acceptPlan() {
    setStatus("accepting");
    const toSchedule = plan.filter((_, i) => selected.has(String(i)));
    await Promise.all(
      toSchedule.map((item) =>
        fetch("/api/v2/calendar/schedule", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
              task_id: item.task_id,
              date: item.date,
              start_time: item.start_time,
              duration_minutes: item.duration_minutes,
            }),
        }),
      ),
    );
    setStatus("done");
  }

  function toggleItem(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(String(i))) next.delete(String(i));
      else next.add(String(i));
      return next;
    });
  }

  if (status === "idle" || status === "error") {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-4 w-4 text-moss" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Find Time</p>
        </div>
        {errorMsg && <p className="mb-2 text-xs text-destructive">{errorMsg}</p>}
        <button
          onClick={() => void fetchPlan()}
          className="w-full rounded-xl bg-moss py-2.5 text-sm font-semibold text-white transition-colors hover:bg-moss/90"
        >
          Find time for my tasks
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-4 w-4 text-moss" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Find Time</p>
        </div>
        <div className="space-y-2 animate-pulse py-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">Planning your week…</p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
        <div className="flex items-center gap-2 mb-2">
          <Check className="h-4 w-4 text-moss" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduled</p>
        </div>
        <p className="text-sm text-foreground">Your week is planned. Check the Calendar tab to see your schedule.</p>
        <button
          onClick={() => { setStatus("idle"); setPlan([]); }}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Plan again
        </button>
      </div>
    );
  }

  // preview or accepting
  const grouped = groupByDate(plan);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-moss" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested Week</p>
        </div>
        <button
          onClick={() => void fetchPlan(true)}
          disabled={status === "accepting"}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {grouped.map(({ date, items }) => (
          <div key={date}>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {formatDate(date)}
            </p>
            {items.map((item, absIdx) => {
              const idx = plan.indexOf(item);
              const isSelected = selected.has(String(idx));
              return (
                <button
                  key={`${item.date}-${item.task_id}`}
                  onClick={() => toggleItem(idx)}
                  className={`mb-1 flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "border-moss/40 bg-moss/5 text-foreground"
                      : "border-border bg-background text-muted-foreground line-through"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <Check className="h-3 w-3 text-moss" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </span>
                  <span className="flex-1 truncate">{item.task_title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {item.start_time} · {item.duration_minutes}min
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => void acceptPlan()}
          disabled={status === "accepting" || selected.size === 0}
          className="flex-1 rounded-xl bg-moss py-2.5 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {status === "accepting" ? "Scheduling…" : `Accept plan (${selected.size})`}
        </button>
        <button
          onClick={() => { setStatus("idle"); setPlan([]); }}
          disabled={status === "accepting"}
          className="rounded-xl border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
