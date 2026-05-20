"use client";

import { useEffect, useState } from "react";

const DOMAIN_COLORS: Record<string, string> = {
  wellbeing: "bg-emerald-100 border-emerald-400 text-emerald-800",
  learning: "bg-blue-100 border-blue-400 text-blue-800",
  work_build: "bg-orange-100 border-orange-400 text-orange-800",
  relationships: "bg-pink-100 border-pink-400 text-pink-800",
  community: "bg-violet-100 border-violet-400 text-violet-800",
  life_admin: "bg-slate-100 border-slate-400 text-slate-800",
  rest_play: "bg-amber-100 border-amber-400 text-amber-800",
};

type ScheduledBlock = {
  id: string;
  task_id: string;
  title: string;
  domain: string;
  goal_id: string | null;
  goal_title: string | null;
  start_time: string;
  duration_minutes: number;
};

type CommunityPlanBlock = {
  id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
};

type BusyBlock = {
  title: string;
  start: string; // ISO datetime
  end: string;
};

const HOUR_START = 6;
const HOUR_END = 23;
const SLOT_HEIGHT = 28; // px per 30-min slot
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * 2;

function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotTop(time: string): number {
  const mins = parseHHMM(time) - HOUR_START * 60;
  return Math.max(0, (mins / 30) * SLOT_HEIGHT);
}

function slotHeight(durationMinutes: number): number {
  return Math.max(20, (durationMinutes / 30) * SLOT_HEIGHT);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function busyStartTime(isoStart: string): string {
  return isoStart.slice(11, 16);
}

function busyDuration(isoStart: string, isoEnd: string): number {
  return Math.round((new Date(isoEnd).getTime() - new Date(isoStart).getTime()) / 60000);
}

type DayData = { scheduled: ScheduledBlock[]; busy: BusyBlock[]; communityPlans: CommunityPlanBlock[] };

type WeekCalendarProps = {
  googleCalendarConnected: boolean;
  filterGoalId?: string | null;
};

export function WeekCalendar({ googleCalendarConnected, filterGoalId = null }: WeekCalendarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(today);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        weekDates.map(async (date) => {
          const res = await fetch(`/api/v2/calendar/${date}`);
          const data = await res.json() as {
            scheduled?: {
              id: string;
              task_id: string;
              goal_title?: string | null;
              start_time?: string | null;
              duration_minutes?: number | null;
              tasks?: { title: string; domain: string; goal_id?: string | null } | null;
            }[];
            communityPlans?: CommunityPlanBlock[];
            busy?: BusyBlock[];
          };
          const scheduled: ScheduledBlock[] = (data.scheduled ?? [])
            .filter((s) => s.start_time)
            .map((s) => {
              const task = s.tasks as { title: string; domain: string; goal_id?: string | null } | null;
              return {
                id: s.id,
                task_id: s.task_id,
                title: task?.title ?? "Task",
                domain: task?.domain ?? "work_build",
                goal_id: task?.goal_id ?? null,
                goal_title: s.goal_title ?? null,
                start_time: s.start_time!,
                duration_minutes: s.duration_minutes ?? 30,
              };
            });
          return { date, scheduled, busy: data.busy ?? [], communityPlans: data.communityPlans ?? [] };
        })
      );
      const map: Record<string, DayData> = {};
      for (const r of results) map[r.date] = { scheduled: r.scheduled, busy: r.busy, communityPlans: r.communityPlans };
      setDayData(map);
      setLoading(false);
    };
    void fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalHeight = TOTAL_SLOTS * SLOT_HEIGHT;
  const hourLabels = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
    const h = HOUR_START + i;
    return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
  });

  function DayColumn({ date }: { date: string }) {
    const data = dayData[date] ?? { scheduled: [], busy: [], communityPlans: [] };
    const d = new Date(date + "T00:00:00");
    const isToday = date === today;
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayNum = d.getDate();

    return (
      <div className="flex-1 min-w-0 border-l border-border/50">
        {/* Day header */}
        <div className={`py-1 text-center text-xs border-b border-border bg-card ${isToday ? "text-moss font-bold" : "text-muted-foreground"}`}>
          <div className="text-[10px] uppercase">{weekday}</div>
          <div className={`mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs ${isToday ? "bg-moss text-white" : ""}`}>
            {dayNum}
          </div>
        </div>
        {/* Time blocks */}
        <div className="relative" style={{ height: totalHeight }}>
          {/* Grid lines every hour */}
          {hourLabels.map((_, i) => (
            <div key={i} className="absolute w-full border-t border-border/30" style={{ top: i * SLOT_HEIGHT * 2 }} />
          ))}
          {/* Busy blocks */}
          {data.busy.map((b, i) => (
            <div
              key={i}
              className="absolute left-0.5 right-0.5 overflow-hidden rounded border border-slate-300 bg-slate-100/80"
              style={{ top: slotTop(busyStartTime(b.start)), height: slotHeight(busyDuration(b.start, b.end)) }}
            >
              <p className="truncate px-1 pt-0.5 text-[9px] text-slate-500">{b.title}</p>
            </div>
          ))}
          {/* Scheduled task blocks */}
          {data.scheduled.map((s) => {
            const colorClass = DOMAIN_COLORS[s.domain] ?? "bg-moss/10 border-moss text-moss";
            const dimmed = filterGoalId && s.goal_id !== filterGoalId ? "opacity-30" : "opacity-100";
            return (
              <div
                key={s.id}
                className={`absolute left-0.5 right-0.5 overflow-hidden rounded border ${colorClass} ${dimmed}`}
                style={{ top: slotTop(s.start_time), height: slotHeight(s.duration_minutes) }}
              >
                <p className="truncate px-1 pt-0.5 text-[9px] font-medium">{s.title}</p>
                {s.goal_title ? (
                  <p className="truncate px-1 text-[8px] text-muted-foreground">{s.goal_title}</p>
                ) : null}
                <p className="px-1 text-[8px] opacity-60">{s.start_time}</p>
              </div>
            );
          })}
          {data.communityPlans.map((plan) => (
            <div
              key={plan.id}
              className="absolute left-0.5 right-0.5 overflow-hidden rounded border border-violet-400 bg-violet-100/90 text-violet-900"
              style={{ top: slotTop(plan.start_time), height: slotHeight(plan.duration_minutes) }}
            >
              <p className="truncate px-1 pt-0.5 text-[9px] font-semibold">Buddy plan</p>
              <p className="truncate px-1 text-[8px]">{plan.title}</p>
              <p className="px-1 text-[8px] opacity-70">{plan.start_time}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">Loading calendar…</div>;
  }

  return (
    <div>
      {/* Mobile: day selector tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 md:hidden">
        {weekDates.map((d) => {
          const dd = new Date(d + "T00:00:00");
          const isActive = d === selectedDay;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                isActive ? "bg-moss text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {dd.toLocaleDateString(undefined, { weekday: "short" })} {dd.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex overflow-x-auto">
        {/* Time axis */}
        <div className="w-9 flex-shrink-0 pt-8">
          {hourLabels.map((label, i) => (
            <div
              key={i}
              className="pr-1 text-right text-[9px] text-muted-foreground"
              style={{ height: SLOT_HEIGHT * 2, lineHeight: `${SLOT_HEIGHT * 2}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Desktop: 7-day grid */}
        <div className="hidden flex-1 md:flex">
          {weekDates.map((d) => <DayColumn key={d} date={d} />)}
        </div>

        {/* Mobile: single day */}
        <div className="flex-1 md:hidden">
          <DayColumn date={selectedDay} />
        </div>
      </div>

      {!googleCalendarConnected && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          <a href="/profile" className="underline underline-offset-2 hover:text-foreground">Connect Google Calendar</a> to see busy slots
        </p>
      )}
    </div>
  );
}
