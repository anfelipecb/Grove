"use client";

import { useMemo, useState } from "react";
import { CalendarClock, AlertTriangle } from "lucide-react";
import {
  computeFreeWindows,
  type FreeWindow,
  type ScheduleProfileInput,
} from "@/lib/free-windows";
import type { CoachGoalDraft } from "@/components/v2/coach/types";

export type ProposedScheduleItem = {
  title: string;
  date: string;
  start_time: string;
  duration_minutes: number;
};

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function sleepHours(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

function workCoversLunch(profile: ScheduleProfileInput): boolean {
  if (profile.noFixedWork) return false;
  const start = profile.workStart ?? "09:00";
  const end = profile.workEnd ?? "17:00";
  const startM = parseInt(start.split(":")[0], 10) * 60 + parseInt(start.split(":")[1], 10);
  const endM = parseInt(end.split(":")[0], 10) * 60 + parseInt(end.split(":")[1], 10);
  const lunchStart = 12 * 60;
  const lunchEnd = 13 * 60;
  return startM <= lunchStart && endM >= lunchEnd;
}

function buildProposedSchedule(goals: CoachGoalDraft[], windows: FreeWindow[]): ProposedScheduleItem[] {
  const tasks = goals.flatMap((goal) =>
    goal.tasks.filter((t) => t.enabled).map((t) => ({ title: t.title, duration: 30 })),
  );
  const proposed: ProposedScheduleItem[] = [];
  const used = new Set<string>();

  for (const task of tasks) {
    const window = windows.find((w) => {
      const key = `${w.date}-${w.start}`;
      return w.minutes >= task.duration && !used.has(key);
    });
    if (!window) continue;
    used.add(`${window.date}-${window.start}`);
    proposed.push({
      title: task.title,
      date: window.date,
      start_time: window.start,
      duration_minutes: task.duration,
    });
  }
  return proposed;
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

type Props = {
  goals: CoachGoalDraft[];
  error: string | null;
  onBack: () => void;
  onSkip: () => void;
  onAccept: (items: ProposedScheduleItem[]) => void;
};

export function WizardStepSchedule({ goals, error, onBack, onSkip, onAccept }: Props) {
  const [scheduleProfile] = useState<ScheduleProfileInput>({
    wakeTime: "06:30",
    bedtime: "22:00",
    workStart: "09:00",
    workEnd: "17:00",
  });

  const today = new Date().toISOString().slice(0, 10);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);

  const { proposed, warnings, suggestLunch } = useMemo(() => {
    const windows = computeFreeWindows(weekDates, scheduleProfile, []);
    const proposedItems = buildProposedSchedule(goals, windows);
    const bed = scheduleProfile.bedtime ?? "22:00";
    const wake = scheduleProfile.wakeTime ?? "06:30";
    const hours = sleepHours(bed, wake);
    const warningList: string[] = [];
    if (hours < 7) {
      warningList.push(
        `Your sleep window looks short (${hours.toFixed(1)}h). Consider protecting at least 7 hours.`,
      );
    }
    const lunchSuggestion = !workCoversLunch(scheduleProfile);
    return { proposed: proposedItems, warnings: warningList, suggestLunch: lunchSuggestion };
  }, [goals, scheduleProfile, weekDates]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-moss" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">Let&apos;s schedule your first week</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Grove found open slots from your typical day. Accept to place tasks, or skip and schedule later.
        </p>

        {warnings.map((w) => (
          <p
            key={w}
            className="mt-3 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
            {w}
          </p>
        ))}
        {suggestLunch ? (
          <p className="mt-2 flex gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            No lunch block detected. Consider blocking 12:00–13:00 in Profile → Schedule.
          </p>
        ) : null}

        {proposed.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {proposed.map((item) => (
              <li
                key={`${item.title}-${item.date}-${item.start_time}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDay(item.date)} · {item.start_time} · {item.duration_minutes}m
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No open slots fit this week. You can skip and schedule from Today.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={() => onAccept(proposed)}
          className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss/90"
        >
          Accept schedule
        </button>
      </div>
    </div>
  );
}
