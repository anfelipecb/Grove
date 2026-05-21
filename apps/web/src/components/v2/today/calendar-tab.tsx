"use client";

import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";
import { WeekCalendar } from "@/components/v2/today/week-calendar";
import { localDateString } from "@/lib/local-date";

type CalendarTabProps = {
  activeTasks: { id: string; title: string; domain: string }[];
  googleCalendarConnected: boolean;
  calendarRefreshKey?: number;
};

type GoalProgress = { id: string; title: string; completed: number; total: number };

const VIEWS = ["Time Blocks", "Month"] as const;
type View = (typeof VIEWS)[number];

function toDateStr(d: Date) {
  return localDateString(d);
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function CalendarTab({
  activeTasks: _activeTasks,
  googleCalendarConnected,
  calendarRefreshKey = 0,
}: CalendarTabProps) {
  const todayDate = new Date();
  const today = toDateStr(todayDate);

  const [view, setView] = useState<View>("Time Blocks");
  const [selectedDate, setSelectedDate] = useState(today);
  const [goalsProgress, setGoalsProgress] = useState<GoalProgress[]>([]);
  const [progressOpen, setProgressOpen] = useState(false);
  const [filterGoalId, setFilterGoalId] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/v2/calendar/${today}?goals_progress=1`)
      .then((r) => r.json())
      .then((data: { goalsProgress?: GoalProgress[] }) => {
        setGoalsProgress(data.goalsProgress ?? []);
      })
      .catch(() => setGoalsProgress([]));
  }, [today]);

  const monthStart = startOfMonth(new Date(selectedDate + "T00:00:00"));
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    toDateStr(new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1)),
  );
  const firstDayOfWeek = monthStart.getDay();

  void addDays;

  function toggleGoalFilter(goalId: string) {
    setFilterGoalId((current) => (current === goalId ? null : goalId));
  }

  return (
    <div className="px-4 py-3" onClick={() => filterGoalId && setFilterGoalId(null)}>
      <div className="mb-4 flex rounded-lg border border-border bg-muted/40 p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={(e) => {
              e.stopPropagation();
              setView(v);
            }}
            className={twMerge(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
              view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "Time Blocks" && goalsProgress.length > 0 ? (
        <div className="mb-3 rounded-lg border border-border bg-card" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setProgressOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Goal progress this week
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${progressOpen ? "rotate-180" : ""}`} />
          </button>
          {progressOpen ? (
            <div className="space-y-2 border-t border-border px-3 py-2">
              {goalsProgress.map((goal) => {
                const pct = goal.total > 0 ? Math.round((goal.completed / goal.total) * 100) : 0;
                const active = filterGoalId === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoalFilter(goal.id)}
                    className={twMerge(
                      "w-full rounded-md px-2 py-1.5 text-left transition-colors",
                      active ? "bg-moss/10 ring-1 ring-moss/40" : "hover:bg-muted/50",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-foreground">{goal.title}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {goal.completed}/{goal.total || "—"}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {view === "Time Blocks" && (
        <div onClick={(e) => e.stopPropagation()}>
          <WeekCalendar
            googleCalendarConnected={googleCalendarConnected}
            filterGoalId={filterGoalId}
            refreshKey={calendarRefreshKey}
          />
        </div>
      )}

      {view === "Month" && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {monthDays.map((d) => {
              const isToday = d === today;
              const isSelected = d === selectedDate;
              const isPast = d < today;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={twMerge(
                    "flex aspect-square items-center justify-center rounded-md text-xs font-medium transition-colors",
                    isToday && "bg-moss text-white",
                    !isToday && isSelected && "text-moss ring-1 ring-moss",
                    !isToday && isPast && "text-muted-foreground hover:bg-muted/50",
                    !isToday && !isPast && "text-foreground hover:bg-muted/50",
                  )}
                >
                  {new Date(d + "T00:00:00").getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
