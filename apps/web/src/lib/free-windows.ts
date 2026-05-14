type TimeBlock = { start: string; end: string }; // "HH:MM"

export type FreeWindow = { date: string; start: string; end: string; minutes: number };

export type ScheduleProfileInput = {
  bedtime?: string;
  wakeTime?: string;
  workStart?: string;
  workEnd?: string;
  noFixedWork?: boolean;
  freeTimePreference?: string;
};

export type CalendarEventInput = { start: string; end: string; title: string }; // ISO datetimes

function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function subtractBlock(free: TimeBlock[], block: TimeBlock): TimeBlock[] {
  const blockStart = parseHHMM(block.start);
  const blockEnd = parseHHMM(block.end);
  const result: TimeBlock[] = [];
  for (const slot of free) {
    const slotStart = parseHHMM(slot.start);
    const slotEnd = parseHHMM(slot.end);
    if (blockEnd <= slotStart || blockStart >= slotEnd) {
      result.push(slot);
    } else {
      if (slotStart < blockStart) result.push({ start: slot.start, end: toHHMM(blockStart) });
      if (slotEnd > blockEnd) result.push({ start: toHHMM(blockEnd), end: slot.end });
    }
  }
  return result;
}

export function computeFreeWindows(
  dates: string[],
  scheduleProfile: ScheduleProfileInput,
  calendarEvents: CalendarEventInput[],
): FreeWindow[] {
  const wakeTime = scheduleProfile.wakeTime ?? "06:30";
  const bedtime = scheduleProfile.bedtime ?? "22:00";
  const workStart = scheduleProfile.noFixedWork ? null : (scheduleProfile.workStart ?? "09:00");
  const workEnd = scheduleProfile.noFixedWork ? null : (scheduleProfile.workEnd ?? "17:00");

  const result: FreeWindow[] = [];
  for (const date of dates) {
    let free: TimeBlock[] = [{ start: wakeTime, end: bedtime }];
    if (workStart && workEnd) {
      free = subtractBlock(free, { start: workStart, end: workEnd });
    }
    for (const event of calendarEvents) {
      const eventDate = event.start.slice(0, 10);
      if (eventDate !== date) continue;
      const eventStart = event.start.slice(11, 16);
      const eventEnd = event.end.slice(11, 16);
      if (eventStart && eventEnd) free = subtractBlock(free, { start: eventStart, end: eventEnd });
    }
    for (const slot of free) {
      const minutes = parseHHMM(slot.end) - parseHHMM(slot.start);
      if (minutes >= 15) result.push({ date, start: slot.start, end: slot.end, minutes });
    }
  }
  return result;
}
