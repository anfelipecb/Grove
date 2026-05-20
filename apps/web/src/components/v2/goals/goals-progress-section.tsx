"use client";

import { computeCompletionStreak } from "@/lib/streak";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  completions30d: { task_id: string; completed_date: string }[];
  monthlyXp: number;
  today: string;
};

function getMondayOfWeek(today: string): Date {
  const d = new Date(`${today}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function GoalsProgressSection({ completions30d, monthlyXp, today }: Props) {
  const countsByDate = new Map<string, number>();
  for (const c of completions30d) {
    countsByDate.set(c.completed_date, (countsByDate.get(c.completed_date) ?? 0) + 1);
  }

  const monday = getMondayOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const last7Dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - i);
    last7Dates.push(d.toISOString().slice(0, 10));
  }
  const activeDaysLast7 = last7Dates.filter((date) => (countsByDate.get(date) ?? 0) > 0).length;

  const monthTaskCount = completions30d.length;
  const streak = computeCompletionStreak(completions30d, today);

  const weekCounts = weekDates.map((date) => countsByDate.get(date) ?? 0);
  const maxWeek = Math.max(1, ...weekCounts);

  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your progress</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last 7 days</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {activeDaysLast7}/7 days with activity
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">This month</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{monthTaskCount} tasks completed</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Streak</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {streak} day{streak === 1 ? "" : "s"}
          </p>
          {monthlyXp > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">+{monthlyXp} XP this month</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2 px-1">
        {weekDates.map((date, i) => {
          const count = weekCounts[i];
          const height = count > 0 ? Math.max(4, Math.round((count / maxWeek) * 48)) : 4;
          const isToday = date === today;
          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full max-w-[40px] rounded-sm ${count > 0 ? "bg-moss" : "bg-muted"} ${isToday ? "ring-1 ring-moss/40" : ""}`}
                style={{ height: `${height}px` }}
                title={`${DAY_LABELS[i]}: ${count} completed`}
              />
              <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
