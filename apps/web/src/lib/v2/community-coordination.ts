import { computeFreeWindows, type CalendarEventInput, type ScheduleProfileInput } from "@/lib/free-windows";

export type InviteStatus =
  | "pending"
  | "proposed"
  | "accepted"
  | "declined"
  | "counter_proposed"
  | "cancelled";

export type CoordinationSuggestion = {
  date: string;
  start: string;
  activityTitle: string;
  proposedDate: string;
  proposedStartTime: string;
  durationMinutes: number;
  rationale: string;
  source?: "shared" | "sender" | "recipient";
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function nextDateStrings(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + i);
    out.push(copy.toISOString().slice(0, 10));
  }
  return out;
}

function overlapWindows(
  a: { date: string; start: string; minutes: number }[],
  b: { date: string; start: string; minutes: number }[],
  durationMinutes: number,
): { date: string; start: string; source: "shared" }[] {
  const out: { date: string; start: string; source: "shared" }[] = [];
  for (const wa of a) {
    for (const wb of b) {
      if (wa.date !== wb.date || wa.start !== wb.start) continue;
      if (wa.minutes >= durationMinutes && wb.minutes >= durationMinutes) {
        out.push({ date: wa.date, start: wa.start, source: "shared" });
      }
    }
  }
  return out;
}

export function buildCoordinationSuggestions(params: {
  dates: string[];
  senderSchedule?: ScheduleProfileInput;
  senderEvents: CalendarEventInput[];
  recipientSchedule?: ScheduleProfileInput;
  recipientEvents: CalendarEventInput[];
  durationMinutes: number;
  limit?: number;
}): CoordinationSuggestion[] {
  const limit = params.limit ?? 3;
  const senderWindows = computeFreeWindows(
    params.dates,
    params.senderSchedule ?? {},
    params.senderEvents,
  );
  const recipientWindows = computeFreeWindows(
    params.dates,
    params.recipientSchedule ?? {},
    params.recipientEvents,
  );

  const shared = overlapWindows(senderWindows, recipientWindows, params.durationMinutes);
  const picks =
    shared.length > 0
      ? shared
      : senderWindows.slice(0, limit).map((w) => ({
          date: w.date,
          start: w.start,
          source: "sender" as const,
        }));

  return picks.slice(0, limit).map((slot) => ({
    date: slot.date,
    start: slot.start,
    activityTitle: "Buddy session",
    proposedDate: slot.date,
    proposedStartTime: slot.start,
    durationMinutes: params.durationMinutes,
    rationale:
      slot.source === "shared"
        ? "You both have this window free."
        : "Based on your schedule.",
    source: slot.source,
  }));
}
