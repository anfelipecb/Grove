"use client";

import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { DomainTag } from "@/components/v2/shared/domain-tag";
import { computeCompletionStreak } from "@/lib/streak";
import { GoalsActivityHeatmap } from "@/components/v2/goals/goals-activity-heatmap";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VALID_DOMAIN_IDS = new Set<string>(LIFE_DOMAINS.map((d) => d.id));

type Completion = {
  task_id: string;
  completed_date: string;
  domain: string;
};

type Props = {
  completions30d: Completion[];
  completionsYear: Completion[];
  monthlyXp: number;
  today: string;
};

type Range = "week" | "month" | "year";

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

function isValidDomain(id: string): id is LifeDomainId {
  return VALID_DOMAIN_IDS.has(id);
}

function filterForRange(completions: Completion[], range: Range, today: string): Completion[] {
  if (range === "month") return completions;
  const monday = getMondayOfWeek(today);
  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = addDays(monday, 6);
  return completions.filter((c) => c.completed_date >= mondayStr && c.completed_date <= sundayStr);
}

function countByDomain(completions: Completion[]): { id: LifeDomainId; label: string; count: number }[] {
  const counts = new Map<LifeDomainId, number>();
  for (const d of LIFE_DOMAINS) {
    counts.set(d.id, 0);
  }
  for (const c of completions) {
    if (isValidDomain(c.domain)) {
      counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);
    }
  }
  return LIFE_DOMAINS.map((d) => ({
    id: d.id,
    label: d.label,
    count: counts.get(d.id) ?? 0,
  }));
}

export function GoalsProgressSection({ completions30d, completionsYear, monthlyXp, today }: Props) {
  const [range, setRange] = useState<Range>("week");

  const sourceCompletions = range === "year" ? completionsYear : completions30d;

  const inRange = useMemo(
    () => (range === "year" ? sourceCompletions : filterForRange(completions30d, range, today)),
    [completions30d, sourceCompletions, range, today],
  );

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of inRange) {
      map.set(c.completed_date, (map.get(c.completed_date) ?? 0) + 1);
    }
    return map;
  }, [inRange]);

  const monday = getMondayOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const weekCounts = weekDates.map((date) => countsByDate.get(date) ?? 0);
  const maxWeek = Math.max(1, ...weekCounts);

  const domainRows = useMemo(() => countByDomain(inRange), [inRange]);
  const maxDomain = Math.max(1, ...domainRows.map((r) => r.count));

  const taskCount = inRange.length;
  const streak = computeCompletionStreak(completions30d, today);

  const rangeDates =
    range === "week"
      ? weekDates
      : (() => {
          const dates: string[] = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date(`${today}T12:00:00`);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().slice(0, 10));
          }
          return dates;
        })();

  const activeDaysInRange =
    range === "year"
      ? new Set(inRange.map((c) => c.completed_date)).size
      : rangeDates.filter((date) => (countsByDate.get(date) ?? 0) > 0).length;
  const daysInRange = range === "week" ? 7 : range === "month" ? 30 : 365;

  return (
    <section className="rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tracking</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tasks you finished, by life domain.</p>
        </div>
        <div className="flex rounded-full border border-border bg-background p-1">
          {(["week", "month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={twMerge(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                range === value ? "bg-moss text-moss-fg" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {range === "week" ? "This week" : range === "month" ? "Last 30 days" : "Last 12 months"}
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {taskCount} task{taskCount === 1 ? "" : "s"} completed
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active days</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {activeDaysInRange}/{daysInRange} days
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Streak</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {streak} day{streak === 1 ? "" : "s"}
          </p>
          {range === "month" && monthlyXp > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">+{monthlyXp} XP this month</p>
          ) : null}
        </div>
      </div>

      {range === "month" || range === "year" ? (
        <GoalsActivityHeatmap
          completions={range === "year" ? completionsYear : completions30d}
          today={today}
          mode={range === "year" ? "year" : "month"}
        />
      ) : null}

      {range === "week" ? (
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
      ) : null}

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">By domain</p>
        <ul className="space-y-2">
          {domainRows.map((row) => {
            const width = row.count > 0 ? Math.max(8, Math.round((row.count / maxDomain) * 100)) : 0;
            return (
              <li
                key={row.id}
                className={twMerge(
                  "flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2",
                  row.count === 0 && "opacity-60",
                )}
              >
                <DomainTag domain={row.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.count} task{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-moss"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
