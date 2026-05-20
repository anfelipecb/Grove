"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatScheduledTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
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
      className={twMerge(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-moss bg-moss/10 text-moss"
          : "border-border bg-background text-muted-foreground hover:border-moss/50",
      )}
    >
      {label}
    </button>
  );
}

type StartTaskSheetProps = {
  taskId: string;
  taskTitle: string;
  initialTime?: string;
  onClose: () => void;
  onScheduled: (taskId: string, displayTime: string) => void;
  onScheduleAndFocus?: (taskId: string, displayTime: string) => void;
};

export function StartTaskSheet({
  taskId,
  taskTitle,
  initialTime,
  onClose,
  onScheduled,
  onScheduleAndFocus,
}: StartTaskSheetProps) {
  const now = new Date();
  const [startTime, setStartTime] = useState(initialTime ?? formatHHMM(now));
  const [duration, setDuration] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function schedule(andFocus: boolean) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      setError("Use a valid time (HH:MM).");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/v2/calendar/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        date: toDateStr(now),
        start_time: startTime,
        duration_minutes: duration,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not schedule task.");
      setSaving(false);
      return;
    }

    const label = formatScheduledTimeLabel(startTime);
    if (andFocus && onScheduleAndFocus) {
      onScheduleAndFocus(taskId, label);
    } else {
      onScheduled(taskId, label);
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
          <h2 className="text-base font-semibold text-foreground">Schedule for now</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-foreground">{taskTitle}</p>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Start time
        </label>
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
            onClick={() => void schedule(false)}
            className="w-full rounded-xl bg-moss py-3 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
          >
            {saving ? "Scheduling…" : "Schedule"}
          </button>
          {onScheduleAndFocus ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void schedule(true)}
              className="w-full rounded-xl border border-moss/40 py-3 text-sm font-semibold text-moss transition-colors hover:bg-moss/10 disabled:opacity-40"
            >
              Schedule + Focus
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
