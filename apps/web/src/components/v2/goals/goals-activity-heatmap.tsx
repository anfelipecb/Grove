"use client";

import { useMemo } from "react";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

type Completion = {
  completed_date: string;
  domain: string;
};

type DayAgg = {
  count: number;
  dominant: LifeDomainId | null;
};

const DOMAIN_CELL: Record<LifeDomainId, string> = {
  wellbeing: "bg-emerald-500",
  learning: "bg-blue-500",
  work_build: "bg-orange-500",
  relationships: "bg-pink-500",
  community: "bg-violet-500",
  life_admin: "bg-slate-500",
  rest_play: "bg-amber-500",
};

const VALID = new Set<string>(LIFE_DOMAINS.map((d) => d.id));

function isLifeDomain(id: string): id is LifeDomainId {
  return VALID.has(id);
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function aggregateByDate(completions: Completion[]): Map<string, DayAgg> {
  const byDate = new Map<string, Map<LifeDomainId, number>>();
  for (const c of completions) {
    if (!isLifeDomain(c.domain)) continue;
    const domain = c.domain;
    const dayMap = byDate.get(c.completed_date) ?? new Map();
    dayMap.set(domain, (dayMap.get(domain) ?? 0) + 1);
    byDate.set(c.completed_date, dayMap);
  }
  const out = new Map<string, DayAgg>();
  for (const [date, domains] of byDate) {
    let dominant: LifeDomainId | null = null;
    let max = 0;
    let total = 0;
    for (const [d, n] of domains) {
      total += n;
      if (n > max) {
        max = n;
        dominant = d;
      }
    }
    out.set(date, { count: total, dominant });
  }
  return out;
}

function cellClass(agg: DayAgg | undefined): string {
  if (!agg || agg.count === 0) return "bg-muted/80";
  const base = agg.dominant ? DOMAIN_CELL[agg.dominant] : "bg-moss";
  if (agg.count >= 4) return base;
  if (agg.count >= 2) return `${base}/70`;
  return `${base}/40`;
}

type Props = {
  completions: Completion[];
  today: string;
  mode: "month" | "year";
};

export function GoalsActivityHeatmap({ completions, today, mode }: Props) {
  const byDate = useMemo(() => aggregateByDate(completions), [completions]);

  if (mode === "month") {
    const end = parseDate(today);
    const cells: { date: string; agg?: DayAgg }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const ds = dateStr(d);
      cells.push({ date: ds, agg: byDate.get(ds) });
    }
    const weeks: { date: string; agg?: DayAgg }[][] = [];
    let row: { date: string; agg?: DayAgg }[] = [];
    const firstDow = parseDate(cells[0].date).getDay();
    for (let i = 0; i < firstDow; i++) row.push({ date: "", agg: undefined });
    for (const cell of cells) {
      row.push(cell);
      if (row.length === 7) {
        weeks.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push({ date: "", agg: undefined });
      weeks.push(row);
    }

    return (
      <div className="mt-4 overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex gap-1">
              {week.map((cell, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={
                    cell.date
                      ? `${cell.date}: ${cell.agg?.count ?? 0} tasks${cell.agg?.dominant ? ` · ${cell.agg.dominant}` : ""}`
                      : undefined
                  }
                  className={`h-3 w-3 rounded-sm ${cell.date ? cellClass(cell.agg) : "bg-transparent"}`}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Darker = more tasks. Color = main domain that day.</p>
      </div>
    );
  }

  const end = parseDate(today);
  const start = new Date(end);
  start.setDate(start.getDate() - 364);
  const grid: { date: string; agg?: DayAgg }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const ds = dateStr(cursor);
    grid.push({ date: ds, agg: byDate.get(ds) });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: { date: string; agg?: DayAgg }[][] = [];
  let week: { date: string; agg?: DayAgg }[] = [];
  const pad = parseDate(grid[0].date).getDay();
  for (let i = 0; i < pad; i++) week.push({ date: "", agg: undefined });
  for (const cell of grid) {
    week.push(cell);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: "", agg: undefined });
    weeks.push(week);
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {col.map((cell, di) => (
              <div
                key={`${wi}-${di}`}
                title={
                  cell.date
                    ? `${cell.date}: ${cell.agg?.count ?? 0} tasks${cell.agg?.dominant ? ` · ${cell.agg.dominant}` : ""}`
                    : undefined
                }
                className={`h-2.5 w-2.5 rounded-[2px] ${cell.date ? cellClass(cell.agg) : "bg-transparent"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Last 12 months. Color = dominant life domain per day.</p>
    </div>
  );
}
