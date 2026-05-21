export const CALENDAR_HOUR_START = 6;
export const CALENDAR_HOUR_END = 23;
export const CALENDAR_SLOT_HEIGHT = 28;
export const CALENDAR_TOTAL_SLOTS = (CALENDAR_HOUR_END - CALENDAR_HOUR_START) * 2;

export function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export function formatHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function slotTop(time: string): number {
  const mins = parseHHMM(time) - CALENDAR_HOUR_START * 60;
  return Math.max(0, (mins / 30) * CALENDAR_SLOT_HEIGHT);
}

export function slotHeight(durationMinutes: number): number {
  return Math.max(20, (durationMinutes / 30) * CALENDAR_SLOT_HEIGHT);
}

/** Snap pixel top to nearest 15-minute start time. */
export function timeFromSlotTop(topPx: number): string {
  const rawMins = CALENDAR_HOUR_START * 60 + (topPx / CALENDAR_SLOT_HEIGHT) * 30;
  const snapped = Math.round(rawMins / 15) * 15;
  const clamped = Math.min(
    CALENDAR_HOUR_END * 60 - 15,
    Math.max(CALENDAR_HOUR_START * 60, snapped),
  );
  return formatHHMM(clamped);
}

export function busyStartTime(isoStart: string): string {
  try {
    const d = new Date(isoStart);
    return formatHHMM(d.getHours() * 60 + d.getMinutes());
  } catch {
    return isoStart.slice(11, 16);
  }
}

export function busyDuration(isoStart: string, isoEnd: string): number {
  return Math.max(15, Math.round((new Date(isoEnd).getTime() - new Date(isoStart).getTime()) / 60000));
}
