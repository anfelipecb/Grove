import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { fetchCalendarEvents, getValidToken } from "@/lib/google-calendar";

export async function GET(_req: Request, { params }: { params: Promise<{ date: string }> }) {
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
      .select("id, task_id, start_time, duration_minutes, tasks(title, domain)")
      .eq("profile_id", profile.id)
      .eq("scheduled_date", date)
      .order("start_time", { ascending: true, nullsFirst: false }),
  ]);

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

  return Response.json({ completions: completions ?? [], scheduled: scheduled ?? [], busy });
}
