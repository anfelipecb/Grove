import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { groqText } from "@/lib/groq";
import { fetchCalendarEvents, busyBlocksFromEvents, getValidToken } from "@/lib/google-calendar";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { computeFreeWindows, type FreeWindow, type ScheduleProfileInput, type CalendarEventInput } from "@/lib/free-windows";

type ScheduleProfile = {
  bedtime?: string;
  wakeTime?: string;
  workStart?: string;
  workEnd?: string;
  freeTimePreference?: string;
  noFixedWork?: boolean;
};

type ActiveTask = {
  id: string;
  title: string;
  domain: string;
  preferred_time: string;
  frequency: string;
};

type PlanItem = {
  task_id: string;
  task_title: string;
  date: string;
  start_time: string;       // "HH:MM"
  duration_minutes: number;
};

type NewTask = {
  title: string;
  domain: string;
  frequency: string;
  preferred_time: string;
};

type FindTimeRequest = {
  regenerate?: boolean;
};

function getDatesForWeek(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function buildSystemPrompt(
  tasks: ActiveTask[],
  scheduleProfile: ScheduleProfile,
  existingScheduled: { date: string; task_id: string }[],
  weekDates: string[],
  today: string,
  regenerate: boolean,
  windowsSummary: string,
): string {
  const bedtime = scheduleProfile.bedtime ?? "22:00";
  const wakeTime = scheduleProfile.wakeTime ?? "06:30";
  const workStart = scheduleProfile.noFixedWork ? null : (scheduleProfile.workStart ?? "09:00");
  const workEnd = scheduleProfile.noFixedWork ? null : (scheduleProfile.workEnd ?? "17:00");
  const freeTime = scheduleProfile.freeTimePreference ?? "flexible";

  const scheduledSet = new Set(existingScheduled.map((s) => `${s.date}:${s.task_id}`));

  const taskList = tasks
    .map((t) => `- id=${t.id} | "${t.title}" | domain=${t.domain} | frequency=${t.frequency} | preferred_time=${t.preferred_time}`)
    .join("\n");

  const alreadyScheduled = existingScheduled.length > 0
    ? existingScheduled.map((s) => `${s.date}: task_id=${s.task_id}`).join("\n")
    : "none";

  const workNote = workStart
    ? `Work/school hours: ${workStart}–${workEnd}. Non-work_build tasks should not be scheduled during work hours unless the task preferred_time overlaps.`
    : "No fixed work schedule — any time slot is available.";

  return `You are a scheduling assistant for Grove, an ADHD-aware personal growth app.

Your job: create a realistic 7-day schedule for the user based on their active tasks and available time.

USER SCHEDULE:
- Sleep: ${bedtime}–${wakeTime} (no tasks during sleep)
- ${workNote}
- Free time preference: ${freeTime}

FREE WINDOWS THIS WEEK (subtract sleep, work, calendar events — place tasks ONLY in these):
${windowsSummary || "No free windows available — use schedule_profile to estimate."}

ACTIVE TASKS:
${taskList || "No tasks yet."}

ALREADY SCHEDULED THIS WEEK (do not duplicate):
${alreadyScheduled}

WEEK DATES (today is ${today}):
${weekDates.join(", ")}

RULES:
1. Schedule daily tasks every day. Schedule weekly tasks 1x this week on the most appropriate day.
2. Respect preferred_time: morning=before noon, afternoon=12-17, evening=after 17.
3. Max 3 tasks per day to prevent overwhelm.
4. Respect sleep window — never schedule during sleep.
5. Prefer free-time windows (${freeTime}) for non-work tasks.
6. Skip task_ids that are already scheduled for that date.
7. If the user has wellbeing or rest_play tasks but NO sleep hygiene tasks, add 1-2 sleep hygiene "newTasks".
8. ${regenerate ? "This is a REGENERATION request — produce a different arrangement than the obvious one." : "Produce the most balanced, realistic schedule."}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "plan": [
    { "task_id": "uuid-or-NEW_0", "task_title": "string", "date": "YYYY-MM-DD", "start_time": "HH:MM", "duration_minutes": 30 }
  ],
  "newTasks": [
    { "title": "string", "domain": "rest_play", "frequency": "daily", "preferred_time": "evening" }
  ]
}

Rules:
1. Place tasks ONLY inside FREE WINDOWS. Never outside them.
2. duration_minutes: 30 for daily tasks, 60 for weekly tasks.
3. Respect preferred_time: morning = before 12:00, afternoon = 12:00–17:00, evening = after 17:00.
4. Max 3 tasks per day, no overlapping tasks.
5. start_time must be "HH:MM" format.

Use "NEW_0", "NEW_1" etc as task_id for newTasks. Max 21 plan items total. newTasks may be empty array.

IMPORTANT: Output ONLY valid JSON. Start with { and end with }.`;
}

function parseJson<T>(raw: string): T | null {
  // Strip markdown fences
  let s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Extract the outermost JSON object — find first { and last }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  try { return JSON.parse(s) as T; } catch { return null; }
}

const VALID_DOMAINS = new Set<string>(LIFE_DOMAINS.map((d) => d.id));

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as FindTimeRequest;
  const regenerate = body.regenerate === true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, schedule_profile, google_calendar_token")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const weekDates = getDatesForWeek(today);

  const [{ data: tasks }, { data: scheduled }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, domain, preferred_time, frequency")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .in("frequency", ["daily", "weekly"]),
    supabase
      .from("scheduled_tasks")
      .select("task_id, scheduled_date")
      .eq("profile_id", profile.id)
      .gte("scheduled_date", today)
      .lte("scheduled_date", weekDates[6]),
  ]);

  const activeTasks: ActiveTask[] = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    domain: t.domain,
    preferred_time: (t.preferred_time as string) ?? "flexible",
    frequency: t.frequency,
  }));

  const existingScheduled = (scheduled ?? []).map((s) => ({
    task_id: s.task_id as string,
    date: s.scheduled_date as string,
  }));

  const scheduleProfile = (profile.schedule_profile ?? {}) as ScheduleProfile;

  // Fetch real calendar busy blocks if Google Calendar is connected
  let calendarBusy: { start: string; end: string; title: string }[] = [];
  if (profile.google_calendar_token) {
    try {
      type TokenShape = { access_token: string; refresh_token?: string; expires_at: number; scope: string };
      const token = profile.google_calendar_token as TokenShape;
      const validToken = await getValidToken(token);
      const events = await fetchCalendarEvents(
        validToken,
        new Date(today + "T00:00:00").toISOString(),
        new Date(weekDates[6] + "T23:59:59").toISOString(),
      );
      calendarBusy = busyBlocksFromEvents(events);
    } catch {
      // Non-fatal — fall back to schedule profile only
    }
  }

  let windowsSummary = "";
  try {
    const freeWindows: FreeWindow[] = computeFreeWindows(
      weekDates,
      scheduleProfile as ScheduleProfileInput,
      calendarBusy.map((b): CalendarEventInput => ({ start: b.start, end: b.end, title: b.title })),
    );
    windowsSummary = freeWindows
      .slice(0, 20)
      .map((w) => `${w.date} ${w.start}–${w.end} (${w.minutes}min free)`)
      .join("\n");
  } catch {
    // Non-fatal — AI will use schedule profile defaults
  }

  const prompt = buildSystemPrompt(activeTasks, scheduleProfile, existingScheduled, weekDates, today, regenerate, windowsSummary);

  const raw = await groqText([{ role: "user", content: prompt }], { temperature: 0.4 });

  if (!raw) {
    return NextResponse.json({ error: "AI unavailable — check GROQ_API_KEY." }, { status: 503 });
  }

  const parsed = parseJson<{ plan?: PlanItem[]; newTasks?: NewTask[] }>(raw);
  if (!parsed?.plan) {
    // Return first 400 chars of raw response for debugging
    return NextResponse.json({ error: "Could not parse AI response.", debug: raw?.slice(0, 400) }, { status: 500 });
  }

  // Resolve NEW_* ids: insert newTasks first, replace ids in plan
  const newTaskIdMap: Record<string, string> = {};
  for (const [i, nt] of (parsed.newTasks ?? []).entries()) {
    const domain = (VALID_DOMAINS.has(nt.domain) ? nt.domain : "rest_play") as LifeDomainId;
    const { data: inserted } = await supabase
      .from("tasks")
      .insert({
        profile_id: profile.id,
        title: nt.title,
        domain,
        frequency: nt.frequency ?? "daily",
        preferred_time: nt.preferred_time ?? "evening",
        status: "active",
        point_value: 10,
      })
      .select("id")
      .single();

    if (inserted) newTaskIdMap[`NEW_${i}`] = inserted.id;
  }

  const plan: PlanItem[] = (parsed.plan ?? [])
    .slice(0, 21)
    .map((item) => ({
      ...item,
      task_id: newTaskIdMap[item.task_id] ?? item.task_id,
    }))
    .filter((item) => weekDates.includes(item.date));

  return NextResponse.json({ plan, newTasks: parsed.newTasks ?? [] });
}
