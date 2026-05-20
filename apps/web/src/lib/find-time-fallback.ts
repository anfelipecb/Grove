import {
  computeFreeWindows,
  type CalendarEventInput,
  type FreeWindow,
  type ScheduleProfileInput,
} from "@/lib/free-windows";

export type FallbackTask = {
  id: string;
  title: string;
  preferred_time: string;
  frequency: string;
};

export type FallbackPlanItem = {
  task_id: string;
  task_title: string;
  date: string;
  start_time: string;
  duration_minutes: number;
};

function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function windowMatchesPreferred(windowStart: string, preferred: string): boolean {
  const minutes = parseHHMM(windowStart);
  switch (preferred) {
    case "morning":
      return minutes < 12 * 60;
    case "afternoon":
      return minutes >= 12 * 60 && minutes < 17 * 60;
    case "evening":
      return minutes >= 17 * 60;
    default:
      return true;
  }
}

function pickStartTime(window: FreeWindow, preferred: string): string {
  const startMin = parseHHMM(window.start);
  const endMin = parseHHMM(window.end);
  let target = startMin;
  if (preferred === "morning") target = Math.max(startMin, parseHHMM("07:00"));
  else if (preferred === "afternoon") target = Math.max(startMin, parseHHMM("12:00"));
  else if (preferred === "evening") target = Math.max(startMin, parseHHMM("17:00"));
  if (target >= endMin - 30) target = startMin;
  const h = Math.floor(target / 60);
  const m = target % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function placeOnDate(
  task: FallbackTask,
  date: string,
  duration: number,
  freeWindows: FreeWindow[],
  scheduledSet: Set<string>,
  perDayCount: Map<string, number>,
  plan: FallbackPlanItem[],
): boolean {
  if (scheduledSet.has(`${date}:${task.id}`)) return false;
  if ((perDayCount.get(date) ?? 0) >= 3) return false;

  const preferred = freeWindows.filter(
    (w) => w.date === date && w.minutes >= duration && windowMatchesPreferred(w.start, task.preferred_time),
  );
  const candidates = preferred.length > 0 ? preferred : freeWindows.filter((w) => w.date === date && w.minutes >= duration);
  if (candidates.length === 0) return false;

  const w = candidates[0];
  plan.push({
    task_id: task.id,
    task_title: task.title,
    date,
    start_time: pickStartTime(w, task.preferred_time),
    duration_minutes: duration,
  });
  scheduledSet.add(`${date}:${task.id}`);
  perDayCount.set(date, (perDayCount.get(date) ?? 0) + 1);
  return true;
}

/**
 * Deterministic week plan when Groq is unavailable — places tasks in free windows.
 */
export function buildFindTimeFallbackPlan(input: {
  weekDates: string[];
  tasks: FallbackTask[];
  existingScheduled: { date: string; task_id: string }[];
  scheduleProfile: ScheduleProfileInput;
  calendarBusy: CalendarEventInput[];
}): FallbackPlanItem[] {
  const { weekDates, tasks, existingScheduled, scheduleProfile, calendarBusy } = input;
  const scheduledSet = new Set(existingScheduled.map((s) => `${s.date}:${s.task_id}`));
  const perDayCount = new Map<string, number>();
  const freeWindows = computeFreeWindows(weekDates, scheduleProfile, calendarBusy);
  const plan: FallbackPlanItem[] = [];

  for (const task of tasks) {
    const duration = task.frequency === "weekly" ? 60 : 30;

    if (task.frequency === "daily") {
      for (const date of weekDates) {
        placeOnDate(task, date, duration, freeWindows, scheduledSet, perDayCount, plan);
      }
    } else {
      for (const date of weekDates) {
        if (placeOnDate(task, date, duration, freeWindows, scheduledSet, perDayCount, plan)) {
          break;
        }
      }
    }
  }

  return plan.slice(0, 21);
}
