"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { localDateString, weekDatesFrom } from "@/lib/local-date";
import {
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_START,
  CALENDAR_SLOT_HEIGHT,
  CALENDAR_TOTAL_SLOTS,
  busyDuration,
  busyStartTime,
  slotHeight,
  slotTop,
  timeFromSlotTop,
} from "@/lib/calendar-grid";

const DOMAIN_COLORS: Record<string, string> = {
  wellbeing: "bg-emerald-100 border-emerald-400 text-emerald-800",
  learning: "bg-blue-100 border-blue-400 text-blue-800",
  work_build: "bg-orange-100 border-orange-400 text-orange-800",
  relationships: "bg-pink-100 border-pink-400 text-pink-800",
  community: "bg-violet-100 border-violet-400 text-violet-800",
  life_admin: "bg-slate-100 border-slate-400 text-slate-800",
  rest_play: "bg-amber-100 border-amber-400 text-amber-800",
};

export type ScheduledBlock = {
  id: string;
  task_id: string;
  title: string;
  domain: string;
  goal_id: string | null;
  goal_title: string | null;
  start_time: string;
  duration_minutes: number;
  scheduled_date: string;
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
  start: string;
  end: string;
};

type DayData = {
  scheduled: ScheduledBlock[];
  busy: BusyBlock[];
  communityPlans: CommunityPlanBlock[];
};

type WeekCalendarProps = {
  googleCalendarConnected: boolean;
  filterGoalId?: string | null;
  refreshKey?: number;
};

function dayDropId(date: string) {
  return `day-${date}`;
}

function DraggableScheduledBlock({
  block,
  dimmed,
}: {
  block: ScheduledBlock;
  dimmed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: block,
  });
  const colorClass = DOMAIN_COLORS[block.domain] ?? "bg-moss/10 border-moss text-moss";
  const style: React.CSSProperties = {
    top: slotTop(block.start_time),
    height: slotHeight(block.duration_minutes),
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 20 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute left-0.5 right-0.5 cursor-grab overflow-hidden rounded border active:cursor-grabbing ${colorClass} ${dimmed ? "opacity-30" : "opacity-100"} ${isDragging ? "shadow-md ring-2 ring-moss/40" : ""}`}
      {...listeners}
      {...attributes}
    >
      <p className="truncate px-1 pt-0.5 text-[9px] font-medium">{block.title}</p>
      {block.goal_title ? (
        <p className="truncate px-1 text-[8px] text-muted-foreground">{block.goal_title}</p>
      ) : null}
      <p className="px-1 text-[8px] opacity-60">{block.start_time}</p>
    </div>
  );
}

function DroppableDayColumn({
  date,
  children,
  totalHeight,
}: {
  date: string;
  children: React.ReactNode;
  totalHeight: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(date) });
  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? "bg-moss/5" : ""}`}
      style={{ height: totalHeight }}
    >
      {children}
    </div>
  );
}

export function WeekCalendar({
  googleCalendarConnected,
  filterGoalId = null,
  refreshKey = 0,
}: WeekCalendarProps) {
  const today = localDateString();
  const weekDates = useMemo(() => weekDatesFrom(today, 7), [today]);

  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(today);
  const [calendarSyncError, setCalendarSyncError] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setRescheduleError(null);
    let syncErr: string | null = null;

    const results = await Promise.all(
      weekDates.map(async (date) => {
        const res = await fetch(`/api/v2/calendar/${date}`);
        const data = (await res.json()) as {
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
          calendarStatus?: string;
          calendarError?: string;
        };
        if (data.calendarStatus === "error" && data.calendarError && !syncErr) {
          syncErr = data.calendarError;
        }
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
              scheduled_date: date,
            };
          });
        return { date, scheduled, busy: data.busy ?? [], communityPlans: data.communityPlans ?? [] };
      }),
    );

    const map: Record<string, DayData> = {};
    for (const r of results) map[r.date] = { scheduled: r.scheduled, busy: r.busy, communityPlans: r.communityPlans };
    setDayData(map);
    setCalendarSyncError(syncErr);
    setLoading(false);
  }, [weekDates]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek, refreshKey]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over, delta } = event;
      if (!over) return;

      const block = active.data.current as ScheduledBlock | undefined;
      if (!block) return;

      const overId = String(over.id);
      const targetDate = overId.startsWith("day-") ? overId.slice(4) : block.scheduled_date;
      const newTop = slotTop(block.start_time) + delta.y;
      const newStartTime = timeFromSlotTop(newTop);

      if (newStartTime === block.start_time && targetDate === block.scheduled_date) return;

      const prev = { ...block };
      setDayData((current) => {
        const next = { ...current };
        const removeFrom = next[block.scheduled_date]?.scheduled.filter((s) => s.id !== block.id) ?? [];
        next[block.scheduled_date] = {
          ...next[block.scheduled_date],
          scheduled: removeFrom,
        };
        const moved: ScheduledBlock = {
          ...block,
          scheduled_date: targetDate,
          start_time: newStartTime,
        };
        const addTo = next[targetDate] ?? { scheduled: [], busy: [], communityPlans: [] };
        next[targetDate] = {
          ...addTo,
          scheduled: [...addTo.scheduled, moved].sort((a, b) => a.start_time.localeCompare(b.start_time)),
        };
        return next;
      });

      const res = await fetch("/api/v2/calendar/schedule", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: block.id,
          start_time: newStartTime,
          scheduled_date: targetDate,
          duration_minutes: block.duration_minutes,
        }),
      });

      if (!res.ok) {
        setRescheduleError("Could not move block. Try again.");
        setDayData((current) => {
          const next = { ...current };
          const tgt = next[targetDate]?.scheduled.filter((s) => s.id !== block.id) ?? [];
          next[targetDate] = { ...next[targetDate], scheduled: tgt };
          next[block.scheduled_date] = {
            ...next[block.scheduled_date],
            scheduled: [...(next[block.scheduled_date]?.scheduled ?? []), prev].sort((a, b) =>
              a.start_time.localeCompare(b.start_time),
            ),
          };
          return next;
        });
        return;
      }
      setRescheduleError(null);
    },
    [],
  );

  const totalHeight = CALENDAR_TOTAL_SLOTS * CALENDAR_SLOT_HEIGHT;
  const hourLabels = Array.from({ length: CALENDAR_HOUR_END - CALENDAR_HOUR_START }, (_, i) => {
    const h = CALENDAR_HOUR_START + i;
    return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
  });

  function DayColumn({ date }: { date: string }) {
    const data = dayData[date] ?? { scheduled: [], busy: [], communityPlans: [] };
    const d = new Date(date + "T12:00:00");
    const isToday = date === today;
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayNum = d.getDate();

    return (
      <div className="min-w-0 flex-1 border-l border-border/50">
        <div
          className={`border-b border-border bg-card py-1 text-center text-xs ${isToday ? "font-bold text-moss" : "text-muted-foreground"}`}
        >
          <div className="text-[10px] uppercase">{weekday}</div>
          <div
            className={`mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs ${isToday ? "bg-moss text-white" : ""}`}
          >
            {dayNum}
          </div>
        </div>
        <DroppableDayColumn date={date} totalHeight={totalHeight}>
          {hourLabels.map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-border/30"
              style={{ top: i * CALENDAR_SLOT_HEIGHT * 2 }}
            />
          ))}
          {data.busy.map((b, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0.5 right-0.5 overflow-hidden rounded border border-slate-300 bg-slate-100/80"
              style={{
                top: slotTop(busyStartTime(b.start)),
                height: slotHeight(busyDuration(b.start, b.end)),
              }}
            >
              <p className="truncate px-1 pt-0.5 text-[9px] text-slate-500">{b.title}</p>
            </div>
          ))}
          {data.scheduled.map((s) => (
            <DraggableScheduledBlock
              key={s.id}
              block={s}
              dimmed={Boolean(filterGoalId && s.goal_id !== filterGoalId)}
            />
          ))}
          {data.communityPlans.map((plan) => (
            <div
              key={plan.id}
              className="pointer-events-none absolute left-0.5 right-0.5 overflow-hidden rounded border border-violet-400 bg-violet-100/90 text-violet-900"
              style={{ top: slotTop(plan.start_time), height: slotHeight(plan.duration_minutes) }}
            >
              <p className="truncate px-1 pt-0.5 text-[9px] font-semibold">Buddy plan</p>
              <p className="truncate px-1 text-[8px]">{plan.title}</p>
            </div>
          ))}
        </DroppableDayColumn>
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse py-12 text-center text-xs text-muted-foreground">Loading calendar…</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={(e) => void handleDragEnd(e)}>
      <div>
        {googleCalendarConnected && calendarSyncError ? (
          <p className="mb-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            Google Calendar could not sync.{" "}
            <a href="/profile" className="font-medium underline underline-offset-2">
              Reconnect in Profile
            </a>
          </p>
        ) : null}
        {rescheduleError ? (
          <p className="mb-2 text-xs text-destructive">{rescheduleError}</p>
        ) : null}
        <p className="mb-2 text-[10px] text-muted-foreground">Drag Grove blocks to move them.</p>

        <div className="flex gap-1 overflow-x-auto pb-2 md:hidden">
          {weekDates.map((d) => {
            const dd = new Date(d + "T12:00:00");
            const isActive = d === selectedDay;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  isActive ? "bg-moss text-white" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {dd.toLocaleDateString(undefined, { weekday: "short" })} {dd.getDate()}
              </button>
            );
          })}
        </div>

        <div className="flex overflow-x-auto">
          <div className="w-9 shrink-0 pt-8">
            {hourLabels.map((label, i) => (
              <div
                key={i}
                className="pr-1 text-right text-[9px] text-muted-foreground"
                style={{ height: CALENDAR_SLOT_HEIGHT * 2, lineHeight: `${CALENDAR_SLOT_HEIGHT * 2}px` }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="hidden flex-1 md:flex">
            {weekDates.map((d) => (
              <DayColumn key={d} date={d} />
            ))}
          </div>
          <div className="flex-1 md:hidden">
            <DayColumn date={selectedDay} />
          </div>
        </div>

        {!googleCalendarConnected ? (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            <a href="/profile" className="underline underline-offset-2 hover:text-foreground">
              Connect Google Calendar
            </a>{" "}
            to see busy slots
          </p>
        ) : null}
      </div>
    </DndContext>
  );
}
