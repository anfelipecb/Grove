export type HasCreatedAt = { created_at: string };

function dayKeyLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function collectDayKeys(events: HasCreatedAt[]): Set<string> {
  const s = new Set<string>();
  for (const e of events) {
    const t = new Date(e.created_at);
    if (!Number.isNaN(t.getTime())) {
      s.add(dayKeyLocal(t));
    }
  }
  return s;
}

/**
 * Derives a logging streak and rolling activity from XP event timestamps (local calendar days).
 */
export function computeXpConsistency(events: HasCreatedAt[]): {
  streakDays: number;
  activeDaysLast7: number;
  message: string;
} {
  const keys = collectDayKeys(events);
  if (keys.size === 0) {
    return {
      streakDays: 0,
      activeDaysLast7: 0,
      message: "Complete a target to start a consistency streak.",
    };
  }

  const today = new Date();
  let streak = 0;
  let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!keys.has(dayKeyLocal(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (keys.has(dayKeyLocal(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }

  let activeLast7 = 0;
  for (let i = 0; i < 7; i++) {
    const c = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    c.setDate(c.getDate() - i);
    if (keys.has(dayKeyLocal(c))) {
      activeLast7 += 1;
    }
  }

  const message =
    streak > 0
      ? `${streak}-day XP logging streak · ${activeLast7} active ${activeLast7 === 1 ? "day" : "days"} in the last week`
      : `${activeLast7} active ${activeLast7 === 1 ? "day" : "days"} in the last week · log XP to build a streak`;

  return { streakDays: streak, activeDaysLast7: activeLast7, message };
}
