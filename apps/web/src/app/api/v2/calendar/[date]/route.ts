import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { fetchCalendarEvents, getValidToken } from "@/lib/google-calendar";

function getMondayISO(fromDate: string): string {
  const d = new Date(fromDate + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date format." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, google_calendar_token")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  const [{ data: completions }, { data: scheduled }] = await Promise.all([
    supabase
      .from("task_completions")
      .select("id, task_id, notes, points_earned, tasks(title, domain)")
      .eq("profile_id", profile.id)
      .eq("completed_date", date),
    supabase
      .from("scheduled_tasks")
      .select("id, task_id, start_time, duration_minutes, tasks(title, domain, goal_id, goals(title))")
      .eq("profile_id", profile.id)
      .eq("scheduled_date", date)
      .order("start_time", { ascending: true, nullsFirst: false }),
  ]);

  const { data: planParticipants } = await supabase
    .from("community_plan_participants")
    .select("plan_id")
    .eq("profile_id", profile.id);

  const planIds = (planParticipants ?? []).map((row) => row.plan_id as string);
  const { data: communityPlans } = planIds.length > 0
    ? await supabase
        .from("community_plans")
        .select("id, title, scheduled_date, start_time, duration_minutes")
        .in("id", planIds)
        .eq("scheduled_date", date)
        .eq("status", "confirmed")
        .order("start_time", { ascending: true })
    : { data: [] as { id: string; title: string; scheduled_date: string; start_time: string; duration_minutes: number }[] };

  const scheduledWithGoals = (scheduled ?? []).map((row) => {
    const raw = row.tasks as unknown;
    const task = (Array.isArray(raw) ? raw[0] : raw) as {
      title: string;
      domain: string;
      goal_id: string | null;
      goals: { title: string } | { title: string }[] | null;
    } | null;
    const goals = task?.goals;
    const goalTitle = Array.isArray(goals) ? goals[0]?.title : goals?.title;
    return {
      ...row,
      goal_title: goalTitle ?? null,
    };
  });

  // Fetch Google Calendar busy blocks for this day if connected
  let busy: { title: string; start: string; end: string }[] = [];
  if (profile.google_calendar_token) {
    try {
      type TokenShape = { access_token: string; refresh_token?: string; expires_at: number; scope: string };
      const token = profile.google_calendar_token as TokenShape;
      const events = await fetchCalendarEvents(
        await getValidToken(token),
        new Date(date + "T00:00:00").toISOString(),
        new Date(date + "T23:59:59").toISOString(),
      );
      busy = events
        .filter((e) => e.start.dateTime)
        .map((e) => ({ title: e.summary ?? "Busy", start: e.start.dateTime!, end: e.end.dateTime! }));
    } catch { /* non-fatal */ }
  }

  const url = new URL(req.url);
  let goalsProgress: Array<{ id: string; title: string; completed: number; total: number }> | undefined;

  if (url.searchParams.get("goals_progress") === "1") {
    const monday = getMondayISO(date);
    const { data: goals } = await supabase
      .from("goals")
      .select("id, title")
      .eq("profile_id", profile.id)
      .eq("status", "active");
    const goalIds = (goals ?? []).map((g) => g.id as string);

    if (goalIds.length > 0) {
      const [{ data: goalTasks }, { data: weekCompletions }] = await Promise.all([
        supabase.from("tasks").select("id, goal_id").in("goal_id", goalIds).eq("status", "active"),
        supabase
          .from("task_completions")
          .select("task_id")
          .eq("profile_id", profile.id)
          .gte("completed_date", monday),
      ]);
      const completedTaskIds = new Set((weekCompletions ?? []).map((c) => c.task_id as string));
      goalsProgress = (goals ?? []).map((goal) => {
        const tasksForGoal = (goalTasks ?? []).filter((t) => t.goal_id === goal.id);
        const total = tasksForGoal.length;
        const completed = tasksForGoal.filter((t) => completedTaskIds.has(t.id as string)).length;
        return { id: goal.id as string, title: goal.title as string, completed, total };
      });
    } else {
      goalsProgress = [];
    }
  }

  return Response.json({
    completions: completions ?? [],
    scheduled: scheduledWithGoals,
    communityPlans: communityPlans ?? [],
    busy,
    ...(goalsProgress !== undefined ? { goalsProgress } : {}),
  });
}
