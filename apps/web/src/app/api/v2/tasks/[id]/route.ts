import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const VALID_PREFERRED_TIMES = ["morning", "afternoon", "evening", "flexible"] as const;
type PreferredTime = (typeof VALID_PREFERRED_TIMES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as { preferred_time?: string };
  const preferredTime = body.preferred_time as PreferredTime | undefined;

  if (!preferredTime || !VALID_PREFERRED_TIMES.includes(preferredTime)) {
    return NextResponse.json(
      { error: "preferred_time must be one of: morning, afternoon, evening, flexible." },
      { status: 400 }
    );
  }

  // Verify the task belongs to the authenticated user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, profile_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !task || task.profile_id !== profile.id) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("tasks")
    .update({ preferred_time: preferredTime })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
