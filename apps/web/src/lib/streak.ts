/** Consecutive days with at least one completion, counting backward from today (inclusive). */
export function computeCompletionStreak(
  rows: { completed_date: string }[],
  today: string,
): number {
  const days = new Set(rows.map((r) => r.completed_date));
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!days.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
