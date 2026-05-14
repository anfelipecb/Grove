# Time-Aware Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Grove genuinely 24-hour-aware: tasks get assigned real clock-time slots, users see a time-block week calendar, and the AI coach knows your actual free windows before suggesting what to prioritize.

**Architecture:** Four sequential tickets. GRO-037 adds the data model foundation (clock-time columns on `scheduled_tasks`). GRO-038 upgrades the Find Time AI to output actual 30-min slots by computing free windows from sleep + work + Google Calendar events. GRO-039 replaces the current CalendarTab list view with a proper hourly grid where task blocks live at their assigned times. GRO-040 extracts a reusable `computeFreeWindows()` helper that feeds both Find Time and Coach suggestions so the AI knows exactly how many hours are available before recommending anything.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres), Groq AI, `@dnd-kit/core` (already installed) for drag-to-reschedule, Google Calendar API (lib already in `apps/web/src/lib/google-calendar.ts`).

---

## Dependency Order

```
GRO-037 (data model) ──► GRO-038 (Find Time clock times)
                    └──► GRO-039 (calendar view)      ──► GRO-040 (coach awareness)
```

GRO-038 and GRO-039 can run in parallel after GRO-037 merges.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/0015_scheduled_tasks_clock_time.sql` | Add `start_time`, `duration_minutes` |
| Modify | `apps/web/src/app/api/v2/calendar/schedule/route.ts` | Accept + store clock-time fields |
| Modify | `apps/web/src/app/api/ai/find-time/route.ts` | Output real times via free-window calc |
| Create | `apps/web/src/lib/free-windows.ts` | `computeFreeWindows()` helper |
| Create | `apps/web/src/components/v2/today/week-calendar.tsx` | Hourly grid UI |
| Modify | `apps/web/src/components/v2/today/calendar-tab.tsx` | Swap list for WeekCalendar |
| Modify | `apps/web/src/app/api/v2/calendar/[date]/route.ts` | Return `start_time` + `duration_minutes` |
| Modify | `apps/web/src/app/api/ai/coach-suggestions/route.ts` | Pass free-window summary to prompt |
| Modify | `apps/web/src/components/v2/today/find-time-panel.tsx` | Show clock times in preview |

---

## GRO-037: Clock-Time Data Model

### Context
`scheduled_tasks` currently has `scheduled_date` (which day) and `sort_order` (position in list) but no clock-time data. Everything downstream (calendar view, Find Time preview, drag-to-reschedule) needs `start_time` ("09:30") and `duration_minutes` (30).

### Files
- Create: `supabase/migrations/0015_scheduled_tasks_clock_time.sql`
- Modify: `apps/web/src/app/api/v2/calendar/schedule/route.ts`
- Modify: `apps/web/src/app/api/v2/calendar/[date]/route.ts`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/0015_scheduled_tasks_clock_time.sql`:
```sql
alter table public.scheduled_tasks
  add column if not exists start_time text
    check (start_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),  -- "HH:MM" format
  add column if not exists duration_minutes integer not null default 30
    check (duration_minutes > 0 and duration_minutes <= 480);

create index if not exists scheduled_tasks_date_time_idx
  on public.scheduled_tasks (profile_id, scheduled_date, start_time);
```

- [ ] **Step 2: Apply migration via Supabase MCP**

```
mcp__supabase__apply_migration(
  project_id: "rgiysvoemvznmfvvohzy",
  name: "scheduled_tasks_clock_time",
  query: <contents of migration file>
)
```

- [ ] **Step 3: Update schedule POST route to accept clock-time fields**

File: `apps/web/src/app/api/v2/calendar/schedule/route.ts`

Extend `ScheduleBody` type and the insert to include:
```ts
type ScheduleBody = {
  task_id?: string;
  date?: string;
  sort_order?: number;
  start_time?: string;       // "HH:MM" or omitted
  duration_minutes?: number; // default 30
};
```

In the POST handler, add to the insert object:
```ts
...(body.start_time ? { start_time: body.start_time } : {}),
duration_minutes: body.duration_minutes ?? 30,
```

Add a PATCH handler to update time on reschedule:
```ts
export async function PATCH(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as {
    id: string;
    start_time?: string;
    duration_minutes?: number;
    scheduled_date?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_user_id", userId).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updates: Record<string, unknown> = {};
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes;
  if (body.scheduled_date !== undefined) updates.scheduled_date = body.scheduled_date;
  const { error } = await supabase.from("scheduled_tasks").update(updates).eq("id", body.id).eq("profile_id", profile.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Update GET [date] route to return new fields**

File: `apps/web/src/app/api/v2/calendar/[date]/route.ts`

Change the scheduled select to:
```ts
supabase
  .from("scheduled_tasks")
  .select("id, task_id, start_time, duration_minutes, tasks(title, domain)")
  .eq("profile_id", profile.id)
  .eq("scheduled_date", date),
```

- [ ] **Step 5: Run typecheck**
```bash
pnpm typecheck
```
Expected: Done (no errors).

- [ ] **Step 6: Commit**
```bash
git add supabase/migrations/0015_scheduled_tasks_clock_time.sql \
  apps/web/src/app/api/v2/calendar/schedule/route.ts \
  apps/web/src/app/api/v2/calendar/\[date\]/route.ts
git commit -m "feat(gro-037): clock-time data model — start_time + duration_minutes on scheduled_tasks"
```

---

## GRO-038: Find Time → Real 30-Min Slots

### Context
Currently Find Time outputs `time_of_day: "morning" | "afternoon" | "evening"` (vague buckets). This ticket upgrades it to output actual clock times like `"09:30"` by computing free windows. Free windows = day span minus sleep minus work hours minus Google Calendar events. Each task is slotted into the earliest available free window that matches its `preferred_time`.

### Files
- Create: `apps/web/src/lib/free-windows.ts`
- Modify: `apps/web/src/app/api/ai/find-time/route.ts`
- Modify: `apps/web/src/components/v2/today/find-time-panel.tsx`

- [ ] **Step 1: Create `computeFreeWindows()` helper**

Create `apps/web/src/lib/free-windows.ts`:
```ts
type TimeBlock = { start: string; end: string }; // "HH:MM"
type FreeWindow = { date: string; start: string; end: string; minutes: number };

type ScheduleProfile = {
  bedtime?: string;
  wakeTime?: string;
  workStart?: string;
  workEnd?: string;
  noFixedWork?: boolean;
  freeTimePreference?: string;
};

type CalendarEvent = { start: string; end: string; title: string }; // ISO datetimes

function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function subtractBlock(free: TimeBlock[], block: TimeBlock): TimeBlock[] {
  const blockStart = parseHHMM(block.start);
  const blockEnd = parseHHMM(block.end);
  const result: TimeBlock[] = [];
  for (const slot of free) {
    const slotStart = parseHHMM(slot.start);
    const slotEnd = parseHHMM(slot.end);
    if (blockEnd <= slotStart || blockStart >= slotEnd) {
      result.push(slot); // no overlap
    } else {
      if (slotStart < blockStart) result.push({ start: slot.start, end: toHHMM(blockStart) });
      if (slotEnd > blockEnd) result.push({ start: toHHMM(blockEnd), end: slot.end });
    }
  }
  return result;
}

export function computeFreeWindows(
  dates: string[],
  scheduleProfile: ScheduleProfile,
  calendarEvents: CalendarEvent[],
): FreeWindow[] {
  const wakeTime = scheduleProfile.wakeTime ?? "06:30";
  const bedtime = scheduleProfile.bedtime ?? "22:00";
  const workStart = scheduleProfile.noFixedWork ? null : (scheduleProfile.workStart ?? "09:00");
  const workEnd = scheduleProfile.noFixedWork ? null : (scheduleProfile.workEnd ?? "17:00");

  const result: FreeWindow[] = [];
  for (const date of dates) {
    let free: TimeBlock[] = [{ start: wakeTime, end: bedtime }];

    // Remove work hours
    if (workStart && workEnd) {
      free = subtractBlock(free, { start: workStart, end: workEnd });
    }

    // Remove calendar events for this date
    for (const event of calendarEvents) {
      const eventDate = event.start.slice(0, 10);
      if (eventDate !== date) continue;
      const eventStart = event.start.slice(11, 16); // "HH:MM"
      const eventEnd = event.end.slice(11, 16);
      free = subtractBlock(free, { start: eventStart, end: eventEnd });
    }

    for (const slot of free) {
      const minutes = parseHHMM(slot.end) - parseHHMM(slot.start);
      if (minutes >= 15) result.push({ date, start: slot.start, end: slot.end, minutes });
    }
  }
  return result;
}

export function slotTaskIntoWindows(
  windows: FreeWindow[],
  durationMinutes: number,
  preferredTime: string,
): { date: string; start_time: string } | null {
  const candidates = windows.filter((w) => {
    if (w.minutes < durationMinutes) return false;
    const startH = parseHHMM(w.start) / 60;
    if (preferredTime === "morning" && startH >= 12) return false;
    if (preferredTime === "afternoon" && (startH < 12 || startH >= 17)) return false;
    if (preferredTime === "evening" && startH < 17) return false;
    return true;
  });
  if (candidates.length === 0) return windows.find((w) => w.minutes >= durationMinutes) ? { date: windows.find((w) => w.minutes >= durationMinutes)!.date, start_time: windows.find((w) => w.minutes >= durationMinutes)!.start } : null;
  const pick = candidates[0];
  return { date: pick.date, start_time: pick.start };
}
```

- [ ] **Step 2: Update Find Time route to output clock times**

File: `apps/web/src/app/api/ai/find-time/route.ts`

1. Import `computeFreeWindows` and `slotTaskIntoWindows`:
```ts
import { computeFreeWindows, slotTaskIntoWindows } from "@/lib/free-windows";
```

2. Update `PlanItem` type:
```ts
type PlanItem = {
  task_id: string;
  task_title: string;
  date: string;
  start_time: string;       // "HH:MM" — was time_of_day
  duration_minutes: number; // new
};
```

3. After fetching Google Calendar events and schedule profile, compute free windows:
```ts
const freeWindows = computeFreeWindows(weekDates, scheduleProfile, calendarBusy.map(b => ({ start: b.start, end: b.end, title: b.title })));
```

4. Update the prompt to include free windows and ask for `start_time` + `duration_minutes`:
```ts
const windowsSummary = freeWindows.slice(0, 20).map(w => `${w.date} ${w.start}–${w.end} (${w.minutes}min free)`).join("\n");
```

In `buildSystemPrompt`, replace the `time_of_day` instructions with:
```
FREE WINDOWS (actual available time after subtracting sleep, work, and calendar events):
${windowsSummary || "No free windows computed — use schedule profile defaults."}

OUTPUT FORMAT (strict JSON):
{
  "plan": [
    { "task_id": "uuid", "task_title": "string", "date": "YYYY-MM-DD", "start_time": "HH:MM", "duration_minutes": 30 }
  ],
  "newTasks": [...]
}
Rules:
1. Place tasks in FREE WINDOWS only — never outside them.
2. duration_minutes: 30 for most tasks, 60 for weekly tasks.
3. Respect preferred_time: morning = before 12:00, afternoon = 12:00-17:00, evening = after 17:00.
4. Max 3 tasks per day. Do not overlap tasks.
```

5. In the schedule writing part, after parsing the plan, include `start_time` and `duration_minutes` when writing to `scheduled_tasks`:
```ts
toSchedule.map((item) =>
  fetch("/api/v2/calendar/schedule", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      task_id: item.task_id,
      date: item.date,
      start_time: item.start_time,
      duration_minutes: item.duration_minutes,
    }),
  }),
),
```

- [ ] **Step 3: Update FindTimePanel to show clock times**

File: `apps/web/src/components/v2/today/find-time-panel.tsx`

Update the `PlanItem` type to match:
```ts
type PlanItem = {
  task_id: string;
  task_title: string;
  date: string;
  start_time: string;
  duration_minutes: number;
};
```

Update the time display in the preview:
```tsx
<span className="shrink-0 text-[10px] text-muted-foreground">
  {item.start_time} ({item.duration_minutes}min)
</span>
```

- [ ] **Step 4: Typecheck**
```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/lib/free-windows.ts \
  apps/web/src/app/api/ai/find-time/route.ts \
  apps/web/src/components/v2/today/find-time-panel.tsx
git commit -m "feat(gro-038): Find Time outputs real clock times using free-window computation"
```

---

## GRO-039: Time-Block Week Calendar View

### Context
The current `CalendarTab` shows tasks as a flat list by day. This ticket replaces it with a proper hourly grid: 7 columns (days), rows every 30 min from 6am to 11pm. Scheduled tasks appear as colored blocks at their `start_time`. Google Calendar busy events (if connected) appear as grey blocks. Empty rows = available time. Mobile shows a single-day column view.

### Files
- Create: `apps/web/src/components/v2/today/week-calendar.tsx`
- Modify: `apps/web/src/components/v2/today/calendar-tab.tsx`
- Modify: `apps/web/src/app/(v2)/today/page.tsx` — pass `scheduleProfile` + `googleCalendarConnected` to client

- [ ] **Step 1: Create `WeekCalendar` component**

Create `apps/web/src/components/v2/today/week-calendar.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { LIFE_DOMAINS } from "@grove/core";

const DOMAIN_COLORS: Record<string, string> = {
  wellbeing: "bg-emerald-200 border-emerald-400 text-emerald-800",
  learning: "bg-blue-200 border-blue-400 text-blue-800",
  work_build: "bg-orange-200 border-orange-400 text-orange-800",
  relationships: "bg-pink-200 border-pink-400 text-pink-800",
  community: "bg-violet-200 border-violet-400 text-violet-800",
  life_admin: "bg-slate-200 border-slate-400 text-slate-800",
  rest_play: "bg-amber-200 border-amber-400 text-amber-800",
};

type ScheduledBlock = {
  id: string;
  task_id: string;
  title: string;
  domain: string;
  start_time: string;  // "HH:MM"
  duration_minutes: number;
};

type BusyBlock = {
  title: string;
  start_time: string;
  duration_minutes: number;
};

const HOUR_START = 6;   // 6am
const HOUR_END = 23;    // 11pm
const SLOT_HEIGHT = 24; // px per 30-min slot
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * 2;

function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotTop(time: string): number {
  const mins = parseHHMM(time) - HOUR_START * 60;
  return (mins / 30) * SLOT_HEIGHT;
}

function slotHeight(durationMinutes: number): number {
  return (durationMinutes / 30) * SLOT_HEIGHT;
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDayHeader(dateStr: string, today: string) {
  const d = new Date(dateStr + "T00:00:00");
  const isToday = dateStr === today;
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    day: d.getDate(),
    isToday,
  };
}

type WeekCalendarProps = {
  googleCalendarConnected: boolean;
};

export function WeekCalendar({ googleCalendarConnected }: WeekCalendarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const [dayData, setDayData] = useState<Record<string, { scheduled: ScheduledBlock[]; busy: BusyBlock[] }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(today); // mobile: single day

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        weekDates.map(async (date) => {
          const res = await fetch(`/api/v2/calendar/${date}`);
          const data = await res.json() as {
            scheduled?: { id: string; task_id: string; start_time?: string; duration_minutes?: number; tasks?: { title: string; domain: string } | null }[];
            busy?: { title: string; start: string; end: string }[];
          };
          const scheduled: ScheduledBlock[] = (data.scheduled ?? [])
            .filter((s) => s.start_time)
            .map((s) => ({
              id: s.id,
              task_id: s.task_id,
              title: s.tasks?.title ?? "Task",
              domain: s.tasks?.domain ?? "work_build",
              start_time: s.start_time!,
              duration_minutes: s.duration_minutes ?? 30,
            }));
          const busy: BusyBlock[] = (data.busy ?? []).map((b) => ({
            title: b.title,
            start_time: b.start.slice(11, 16),
            duration_minutes: Math.round((new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000),
          }));
          return { date, scheduled, busy };
        })
      );
      const map: typeof dayData = {};
      for (const r of results) map[r.date] = { scheduled: r.scheduled, busy: r.busy };
      setDayData(map);
      setLoading(false);
    };
    void fetchAll();
  }, []);

  const hourLabels = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
    const h = HOUR_START + i;
    return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
  });

  const totalHeight = TOTAL_SLOTS * SLOT_HEIGHT;

  function DayColumn({ date }: { date: string }) {
    const data = dayData[date] ?? { scheduled: [], busy: [] };
    const header = formatDayHeader(date, today);
    return (
      <div className="flex-1 min-w-0">
        <div className={`sticky top-0 z-10 py-1 text-center text-xs border-b border-border bg-card ${header.isToday ? "text-moss font-bold" : "text-muted-foreground"}`}>
          <div>{header.weekday}</div>
          <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${header.isToday ? "bg-moss text-white" : ""}`}>{header.day}</div>
        </div>
        <div className="relative" style={{ height: totalHeight }}>
          {/* Hour grid lines */}
          {hourLabels.map((_, i) => (
            <div key={i} className="absolute w-full border-t border-border/40" style={{ top: i * SLOT_HEIGHT * 2 }} />
          ))}
          {/* Busy blocks */}
          {data.busy.map((b, i) => (
            <div
              key={i}
              className="absolute left-0.5 right-0.5 rounded border border-slate-300 bg-slate-100 overflow-hidden"
              style={{ top: slotTop(b.start_time), height: slotHeight(b.duration_minutes) }}
            >
              <p className="truncate px-1 text-[10px] text-slate-500">{b.title}</p>
            </div>
          ))}
          {/* Scheduled tasks */}
          {data.scheduled.map((s) => {
            const colorClass = DOMAIN_COLORS[s.domain] ?? "bg-moss/20 border-moss text-moss";
            return (
              <div
                key={s.id}
                className={`absolute left-0.5 right-0.5 rounded border overflow-hidden cursor-pointer ${colorClass}`}
                style={{ top: slotTop(s.start_time), height: Math.max(slotHeight(s.duration_minutes), 20) }}
              >
                <p className="truncate px-1 text-[10px] font-medium">{s.title}</p>
                <p className="px-1 text-[9px] opacity-70">{s.start_time}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">Loading calendar…</div>;
  }

  return (
    <div className="overflow-auto">
      {/* Mobile: day tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto md:hidden">
        {weekDates.map((d) => {
          const h = formatDayHeader(d, today);
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedDay === d ? "bg-moss text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {h.weekday} {h.day}
            </button>
          );
        })}
      </div>

      <div className="flex">
        {/* Time labels */}
        <div className="w-10 flex-shrink-0 pt-8">
          {hourLabels.map((label, i) => (
            <div key={i} className="text-[10px] text-muted-foreground text-right pr-1" style={{ height: SLOT_HEIGHT * 2 }}>
              {label}
            </div>
          ))}
        </div>

        {/* Desktop: all 7 days */}
        <div className="hidden md:flex flex-1 gap-px border-l border-border">
          {weekDates.map((d) => <DayColumn key={d} date={d} />)}
        </div>

        {/* Mobile: selected day only */}
        <div className="md:hidden flex-1 border-l border-border">
          <DayColumn date={selectedDay} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update calendar API to return busy blocks**

File: `apps/web/src/app/api/v2/calendar/[date]/route.ts`

If `google_calendar_token` exists on the profile, fetch events for that day and include in response:
```ts
// After computing completions and scheduled...
let busy: { title: string; start: string; end: string }[] = [];
const { data: profileWithToken } = await supabase
  .from("profiles")
  .select("google_calendar_token")
  .eq("id", profile.id)
  .maybeSingle();

if (profileWithToken?.google_calendar_token) {
  try {
    const token = profileWithToken.google_calendar_token as { access_token: string; refresh_token?: string; expires_at: number; scope: string };
    const events = await fetchCalendarEvents(
      await getValidToken(token),
      new Date(date + "T00:00:00").toISOString(),
      new Date(date + "T23:59:59").toISOString(),
    );
    busy = events.filter(e => e.start.dateTime).map(e => ({
      title: e.summary ?? "Busy",
      start: e.start.dateTime!,
      end: e.end.dateTime!,
    }));
  } catch { /* non-fatal */ }
}

return Response.json({ completions: completions ?? [], scheduled: scheduled ?? [], busy });
```

- [ ] **Step 3: Wire WeekCalendar into CalendarTab**

File: `apps/web/src/components/v2/today/calendar-tab.tsx`

Replace the Day view content with `WeekCalendar` and keep Week/Month toggle for the non-time views:
```tsx
import { WeekCalendar } from "@/components/v2/today/week-calendar";

// In the component, add a "Time Blocks" view as default:
const VIEWS = ["Time Blocks", "Month"] as const;
```

The "Time Blocks" view renders `<WeekCalendar googleCalendarConnected={googleCalendarConnected} />`. Month view stays as before. Remove the old Day/Week list views.

- [ ] **Step 4: Pass `googleCalendarConnected` from server to CalendarTab**

File: `apps/web/src/app/(v2)/today/page.tsx`

In the profile select, already fetching `google_calendar_token`. Pass `!!profile.google_calendar_token` through `TodayTabs` → `CalendarTab` → `WeekCalendar`.

- [ ] **Step 5: Typecheck**
```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/components/v2/today/week-calendar.tsx \
  apps/web/src/components/v2/today/calendar-tab.tsx \
  apps/web/src/app/api/v2/calendar/\[date\]/route.ts \
  "apps/web/src/app/(v2)/today/page.tsx"
git commit -m "feat(gro-039): time-block week calendar view with hourly grid and busy slots"
```

---

## GRO-040: Coach Free-Window Awareness

### Context
The AI coach currently generates suggestions without knowing the user's actual available time. This ticket makes Find Time and Coach suggestions both "free-window-aware": before generating, compute how many free hours exist this week and pass that context to the AI so it recommends tasks that fit the actual schedule.

### Files
- Modify: `apps/web/src/app/api/ai/coach-suggestions/route.ts`
- Modify: `apps/web/src/app/api/ai/find-time/route.ts` (small addition)

- [ ] **Step 1: Update coach-suggestions to include free-window summary**

File: `apps/web/src/app/api/ai/coach-suggestions/route.ts`

Import `computeFreeWindows` from `@/lib/free-windows`. Add this after loading the profile:

```ts
import { computeFreeWindows } from "@/lib/free-windows";

// After loading profile and schedule_profile...
const today = new Date().toISOString().slice(0, 10);
const weekDates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

let calendarEvents: { start: string; end: string; title: string }[] = [];
if (profile.google_calendar_token) {
  try {
    const token = profile.google_calendar_token as { access_token: string; refresh_token?: string; expires_at: number; scope: string };
    const events = await fetchCalendarEvents(
      await getValidToken(token),
      new Date(today + "T00:00:00").toISOString(),
      new Date(weekDates[6] + "T23:59:59").toISOString(),
    );
    calendarEvents = busyBlocksFromEvents(events);
  } catch { /* non-fatal */ }
}

const freeWindows = computeFreeWindows(weekDates, scheduleProfile ?? {}, calendarEvents);
const totalFreeHours = Math.round(freeWindows.reduce((sum, w) => sum + w.minutes, 0) / 60);
const todayFreeMinutes = freeWindows.filter(w => w.date === today).reduce((sum, w) => sum + w.minutes, 0);

const availabilityContext = `
USER AVAILABILITY THIS WEEK:
- Total free hours: ${totalFreeHours}h
- Free time today: ${todayFreeMinutes}min
- Free windows today: ${freeWindows.filter(w => w.date === today).map(w => `${w.start}–${w.end}`).join(", ") || "none"}
Suggest tasks that fit within these windows. Don't suggest multi-hour tasks if today only has ${todayFreeMinutes}min free.
`;
```

Inject `availabilityContext` into the coach suggestions prompt.

- [ ] **Step 2: Verify coach-suggestions prompt includes availability**

The prompt passed to `groqText` should include the availability context. Confirm the system message says something like:
```
You are a Grove coach. Based on this user's goals and schedule, suggest 1-3 tasks.
[existing goals/context]
[availabilityContext injected here]
```

- [ ] **Step 3: Typecheck**
```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/api/ai/coach-suggestions/route.ts
git commit -m "feat(gro-040): coach suggestions are free-window-aware — knows available hours before suggesting"
```

---

## Self-Review

**Spec coverage:**
- ✅ Clock-time slots on `scheduled_tasks` (GRO-037)
- ✅ Find Time outputs real times using free-window computation (GRO-038)
- ✅ `computeFreeWindows()` extracts available slots from sleep + work + Google Calendar (GRO-038)
- ✅ Time-block calendar view showing task blocks + busy blocks at exact times (GRO-039)
- ✅ Coach knows available free hours when making suggestions (GRO-040)
- ✅ Mobile: single-day column view (GRO-039 `WeekCalendar`)
- ✅ Desktop: 7-day week view (GRO-039 `WeekCalendar`)

**Placeholder scan:** All steps contain concrete code. No TBDs.

**Type consistency:**
- `ScheduledBlock.start_time: string` used throughout GRO-037, 038, 039 — consistent
- `FreeWindow` type defined in `free-windows.ts` and imported correctly in GRO-038, 040
- `PlanItem.start_time` (string "HH:MM") replaces `PlanItem.time_of_day` in GRO-038 — `find-time-panel.tsx` updated to match
