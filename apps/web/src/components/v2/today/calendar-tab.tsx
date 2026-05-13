"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { DayLog } from "@/components/v2/today/day-log";
import { PlanTomorrow } from "@/components/v2/today/plan-tomorrow";

type CalendarTabProps = {
  activeTasks: { id: string; title: string; domain: string }[];
};

type ViewMode = "Day" | "Week" | "Month";
const VIEWS: ViewMode[] = ["Day", "Week", "Month"];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function CalendarTab({ activeTasks }: CalendarTabProps) {
  const todayDate = new Date();
  const today = toDateStr(todayDate);
  const tomorrow = toDateStr(addDays(todayDate, 1));

  const [view, setView] = useState<ViewMode>("Day");
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const weekStart = startOfWeek(new Date(selectedDate + "T00:00:00"));
  const weekDays = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(weekStart, i)));

  const monthStart = startOfMonth(new Date(selectedDate + "T00:00:00"));
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    toDateStr(new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1))
  );
  const firstDayOfWeek = monthStart.getDay();

  function formatDay(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="px-4 py-3">
      {/* View toggle */}
      <div className="mb-4 flex rounded-lg border border-border bg-muted/40 p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={twMerge(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
              view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "Day" && (
        <div>
          <div className="mb-3 flex gap-2">
            {[today, tomorrow].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={twMerge(
                  "flex-1 rounded-md border py-2 text-xs font-medium transition-colors",
                  selectedDate === d
                    ? "border-moss bg-moss/10 text-moss"
                    : "border-border text-muted-foreground hover:border-moss/50"
                )}
              >
                {d === today ? "Today" : "Tomorrow"}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs text-muted-foreground">{formatDay(selectedDate)}</p>
          <DayLog date={selectedDate} />
          {selectedDate === today && (
            <PlanTomorrow tomorrow={tomorrow} activeTasks={activeTasks} />
          )}
        </div>
      )}

      {view === "Week" && (
        <div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => {
              const isToday = d === today;
              const isPast = d < today;
              return (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setExpandedDay(expandedDay === d ? null : d); }}
                  className={twMerge(
                    "flex flex-col items-center rounded-md py-2 text-xs transition-colors",
                    isToday && "bg-moss/10 text-moss font-semibold",
                    !isToday && isPast && "text-muted-foreground hover:bg-muted/50",
                    !isToday && !isPast && "text-foreground hover:bg-muted/50",
                    expandedDay === d && "ring-1 ring-moss"
                  )}
                >
                  <span className="text-[10px] uppercase tracking-wide">
                    {new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span className="mt-0.5 text-sm font-medium">
                    {new Date(d + "T00:00:00").getDate()}
                  </span>
                </button>
              );
            })}
          </div>
          {expandedDay && (
            <div className="mt-3 rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{formatDay(expandedDay)}</p>
              <DayLog date={expandedDay} />
            </div>
          )}
          <PlanTomorrow tomorrow={tomorrow} activeTasks={activeTasks} />
        </div>
      )}

      {view === "Month" && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <span key={d}>{d}</span>)}
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
                  onClick={() => { setSelectedDate(d); setExpandedDay(expandedDay === d ? null : d); }}
                  className={twMerge(
                    "aspect-square rounded-md text-xs font-medium flex items-center justify-center transition-colors",
                    isToday && "bg-moss text-white",
                    !isToday && isSelected && "ring-1 ring-moss text-moss",
                    !isToday && isPast && "text-muted-foreground hover:bg-muted/50",
                    !isToday && !isPast && "text-foreground hover:bg-muted/50"
                  )}
                >
                  {new Date(d + "T00:00:00").getDate()}
                </button>
              );
            })}
          </div>
          {expandedDay && (
            <div className="mt-3 rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{formatDay(expandedDay)}</p>
              <DayLog date={expandedDay} />
            </div>
          )}
          <PlanTomorrow tomorrow={tomorrow} activeTasks={activeTasks} />
        </div>
      )}
    </div>
  );
}
