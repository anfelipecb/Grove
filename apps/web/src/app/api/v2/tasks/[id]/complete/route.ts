import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const { id } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  const { data: task } = await supabase
    .from("tasks")
    .select("id, point_value, community_point_value, is_community_task, profile_id")
    .eq("id", id)
    .maybeSingle();
  if (!task || task.profile_id !== profile.id) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error: insertError } = await supabase.from("task_completions").insert({
    task_id: id,
    profile_id: profile.id,
    completed_date: today,
    points_earned: task.point_value,
    community_points_earned: task.is_community_task ? task.community_point_value : 0,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return Response.json({ error: "Already completed today." }, { status: 409 });
    }
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const communityGain = task.is_community_task ? task.community_point_value : 0;
  await supabase
    .from("profiles")
    .update({
      spendable_points: profile.spendable_points + task.point_value,
      ...(communityGain > 0 ? { community_points: { increment: communityGain } } : {}),
    })
    .eq("id", profile.id);

  return Response.json({ ok: true, points_earned: task.point_value });
}
