"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export type ScheduleProfile = {
  bedtime?: string;
  wakeTime?: string;
  workStart?: string;
  workEnd?: string;
  freeTimePreference?: "mornings" | "afternoons" | "evenings" | "weekends" | "flexible";
  noFixedWork?: boolean;
};

type ScheduleFormProps = {
  initialSchedule: ScheduleProfile;
};

function sleepDuration(bedtime?: string, wakeTime?: string): string | null {
  if (!bedtime || !wakeTime) return null;
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ScheduleForm({ initialSchedule }: ScheduleFormProps) {
  const [bedtime, setBedtime] = useState(initialSchedule.bedtime ?? "");
  const [wakeTime, setWakeTime] = useState(initialSchedule.wakeTime ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const duration = sleepDuration(bedtime || undefined, wakeTime || undefined);

  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);

    const schedule: ScheduleProfile = {
      ...initialSchedule,
      bedtime: bedtime || undefined,
      wakeTime: wakeTime || undefined,
    };

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
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sleep Schedule
        </p>
        {duration && (
          <span className="text-xs font-medium text-moss">{duration} sleep</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Used by Find Time to protect your sleep and schedule tasks at the right moment.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Moon className="h-3 w-3" /> Bedtime
          </span>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => { setBedtime(e.target.value); setStatus("idle"); }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30"
          />
        </label>
        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sun className="h-3 w-3" /> Wake up
          </span>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => { setWakeTime(e.target.value); setStatus("idle"); }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-xl bg-moss px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
        </button>
        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      </div>
    </div>
  );
}
