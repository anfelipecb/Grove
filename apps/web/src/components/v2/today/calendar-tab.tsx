"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { WeekCalendar } from "@/components/v2/today/week-calendar";

type CalendarTabProps = {
  activeTasks: { id: string; title: string; domain: string }[];
  googleCalendarConnected: boolean;
};

const VIEWS = ["Time Blocks", "Month"] as const;
type View = (typeof VIEWS)[number];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function CalendarTab({ activeTasks: _activeTasks, googleCalendarConnected }: CalendarTabProps) {
  const todayDate = new Date();
  const today = toDateStr(todayDate);

  const [view, setView] = useState<View>("Time Blocks");
  const [selectedDate, setSelectedDate] = useState(today);

  const monthStart = startOfMonth(new Date(selectedDate + "T00:00:00"));
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    toDateStr(new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1))
  );
  const firstDayOfWeek = monthStart.getDay();

  // suppress unused warning — activeTasks kept in props for API stability
  void addDays;

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

      {view === "Time Blocks" && (
        <WeekCalendar googleCalendarConnected={googleCalendarConnected} />
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
                  onClick={() => setSelectedDate(d)}
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
        </div>
      )}
    </div>
  );
}
