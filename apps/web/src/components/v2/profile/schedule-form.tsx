"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";

export type ScheduleProfile = {
  bedtime?: string;
  wakeTime?: string;
  workStart?: string;
  workEnd?: string;
  freeTimePreference?: "mornings" | "afternoons" | "evenings" | "weekends" | "flexible";
  noFixedWork?: boolean;
};

const FREE_TIME_OPTIONS: { value: ScheduleProfile["freeTimePreference"]; label: string }[] = [
  { value: "mornings", label: "Mornings" },
  { value: "afternoons", label: "Afternoons" },
  { value: "evenings", label: "Evenings" },
  { value: "weekends", label: "Weekends" },
  { value: "flexible", label: "Flexible" },
];

type ScheduleFormProps = {
  initialSchedule: ScheduleProfile;
};

export function ScheduleForm({ initialSchedule }: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<ScheduleProfile>(initialSchedule);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function update(patch: Partial<ScheduleProfile>) {
    setSchedule((prev) => ({ ...prev, ...patch }));
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);

    const res = await fetch("/api/v2/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schedule_profile: schedule }),
    });

    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setErrorMsg(body.error ?? "Could not save.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        My Schedule
      </p>

      {/* Sleep section */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Sleep</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Bedtime</span>
            <input
              type="time"
              value={schedule.bedtime ?? ""}
              onChange={(e) => update({ bedtime: e.target.value || undefined })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/40"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Wake time</span>
            <input
              type="time"
              value={schedule.wakeTime ?? ""}
              onChange={(e) => update({ wakeTime: e.target.value || undefined })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/40"
            />
          </label>
        </div>
      </div>

      {/* Work hours section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Work hours</p>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={schedule.noFixedWork ?? false}
              onChange={(e) => update({ noFixedWork: e.target.checked })}
              className="h-3.5 w-3.5 rounded accent-moss"
            />
            No fixed schedule
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Start</span>
            <input
              type="time"
              value={schedule.workStart ?? ""}
              onChange={(e) => update({ workStart: e.target.value || undefined })}
              disabled={schedule.noFixedWork}
              className={twMerge(
                "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/40",
                schedule.noFixedWork && "opacity-40 cursor-not-allowed"
              )}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">End</span>
            <input
              type="time"
              value={schedule.workEnd ?? ""}
              onChange={(e) => update({ workEnd: e.target.value || undefined })}
              disabled={schedule.noFixedWork}
              className={twMerge(
                "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/40",
                schedule.noFixedWork && "opacity-40 cursor-not-allowed"
              )}
            />
          </label>
        </div>
      </div>

      {/* Free time preference */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Best free time</p>
        <div className="flex flex-wrap gap-2">
          {FREE_TIME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                update({
                  freeTimePreference:
                    schedule.freeTimePreference === value ? undefined : value,
                })
              }
              className={twMerge(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                schedule.freeTimePreference === value
                  ? "border-moss bg-moss/15 text-moss"
                  : "border-border bg-background text-muted-foreground hover:border-moss/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
        </button>
        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      </div>
    </div>
  );
}
