/** Local calendar date as YYYY-MM-DD (avoids UTC midnight skew). */
export function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysLocal(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return localDateString(d);
}

export function getMondayLocal(fromDate?: string): string {
  const d = fromDate ? new Date(fromDate + "T12:00:00") : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateString(d);
}

export function weekDatesFrom(startDate: string, count = 7): string[] {
  return Array.from({ length: count }, (_, i) => addDaysLocal(startDate, i));
}
