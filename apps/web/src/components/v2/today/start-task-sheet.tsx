"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TaskRowData } from "@/components/v2/today/task-row";

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTimeInput(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplayTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-moss bg-moss/10 text-moss"
          : "border-border bg-background text-muted-foreground hover:border-moss/50"
      }`}
    >
      {label}
    </button>
  );
}

type StartTaskSheetProps = {
  task: TaskRowData;
  onClose: () => void;
  onScheduled: (taskId: string, displayTime: string) => void;
  onScheduleAndFocus?: () => void;
};

export function StartTaskSheet({
  task,
  onClose,
  onScheduled,
  onScheduleAndFocus,
}: StartTaskSheetProps) {
  const [startTime, setStartTime] = useState(() => formatTimeInput(new Date()));
  const [duration, setDuration] = useState<(typeof DURATION_OPTIONS)[number]>(30);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSchedule(andFocus: boolean) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      setError("Use HH:MM format.");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/v2/calendar/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task_id: task.id,
        date: toDateStr(new Date()),
        start_time: startTime,
        duration_minutes: duration,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not schedule.");
      setSaving(false);
      return;
    }

    onScheduled(task.id, formatDisplayTime(startTime));
    if (andFocus && onScheduleAndFocus) {
      onScheduleAndFocus();
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground truncate pr-2">{task.title}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule for now</p>
        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            setError(null);
          }}
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30"
        />

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((mins) => (
            <ChipButton
              key={mins}
              label={`${mins} min`}
              selected={duration === mins}
              onClick={() => setDuration(mins)}
            />
          ))}
        </div>

        {error ? <p className="mb-3 text-xs text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSchedule(false)}
            className="w-full rounded-xl bg-moss py-3 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
          >
            {saving ? "Scheduling…" : "Schedule"}
          </button>
          {onScheduleAndFocus ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSchedule(true)}
              className="w-full rounded-xl border border-moss py-3 text-sm font-semibold text-moss transition-colors hover:bg-moss/10 disabled:opacity-40"
            >
              Schedule + Focus
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
