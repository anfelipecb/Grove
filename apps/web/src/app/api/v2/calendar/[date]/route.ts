import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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
    .select("id")
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
      .select("id, task_id, tasks(title, domain)")
      .eq("profile_id", profile.id)
      .eq("scheduled_date", date),
  ]);

  return Response.json({ completions: completions ?? [], scheduled: scheduled ?? [] });
}
