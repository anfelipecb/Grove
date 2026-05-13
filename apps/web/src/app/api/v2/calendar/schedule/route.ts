import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type ScheduleBody = { task_id?: string; date?: string };

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as ScheduleBody;
  const taskId = typeof body.task_id === "string" ? body.task_id.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";

  if (!taskId) return Response.json({ error: "task_id is required." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date format." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!task) return Response.json({ error: "Task not found." }, { status: 404 });

  const { error } = await supabase
    .from("scheduled_tasks")
    .insert({ task_id: taskId, profile_id: profile.id, scheduled_date: date });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Already scheduled for this date." }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as ScheduleBody;
  const taskId = typeof body.task_id === "string" ? body.task_id.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";

  if (!taskId || !date) return Response.json({ error: "task_id and date are required." }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  await supabase
    .from("scheduled_tasks")
    .delete()
    .eq("task_id", taskId)
    .eq("profile_id", profile.id)
    .eq("scheduled_date", date);

  return Response.json({ ok: true });
}
