import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type ScheduleBody = { task_id?: string; date?: string; sort_order?: number; start_time?: string; duration_minutes?: number };
type PatchBody = { id: string; start_time?: string; duration_minutes?: number; scheduled_date?: string };

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as ScheduleBody;
  const taskId = typeof body.task_id === "string" ? body.task_id.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const sortOrder = typeof body.sort_order === "number" ? Math.floor(body.sort_order) : undefined;

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

  const insertPayload: Record<string, unknown> = { task_id: taskId, profile_id: profile.id, scheduled_date: date };
  if (sortOrder !== undefined) insertPayload.sort_order = sortOrder;
  if (typeof body.start_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.start_time)) {
    insertPayload.start_time = body.start_time;
  }
  insertPayload.duration_minutes = (typeof body.duration_minutes === "number" && body.duration_minutes > 0) ? body.duration_minutes : 30;

  const { error } = await supabase
    .from("scheduled_tasks")
    .insert(insertPayload);

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Already scheduled for this date." }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function PATCH(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as PatchBody;
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_user_id", userId).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes;
  if (body.scheduled_date !== undefined) updates.scheduled_date = body.scheduled_date;

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase.from("scheduled_tasks").update(updates).eq("id", body.id).eq("profile_id", profile.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
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
