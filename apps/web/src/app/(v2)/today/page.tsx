import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PointsHeader } from "@/components/v2/shared/points-header";
import { TodayTabs } from "@/components/v2/today/today-tabs";
import type { TaskRowData } from "@/components/v2/today/task-row";

export default async function TodayPage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/sign-in");

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Database not configured.
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: tasks }, { data: completions }, { data: recentCompletions }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, domain, is_required, is_community_task, point_value, community_point_value")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .in("frequency", ["daily", "weekly"]),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("profile_id", profile.id)
      .eq("completed_date", today),
    // Last 30 days of completions to compute streak
    supabase
      .from("task_completions")
      .select("completed_date")
      .eq("profile_id", profile.id)
      .gte("completed_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("completed_date", { ascending: false }),
  ]);

  const completedToday = new Set((completions ?? []).map((c) => c.task_id));

  const taskRows: TaskRowData[] = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    domain: t.domain,
    is_required: t.is_required,
    is_community_task: t.is_community_task,
    point_value: t.point_value,
    community_point_value: t.community_point_value,
    completed: completedToday.has(t.id),
  }));

  const streak = computeStreak(recentCompletions ?? [], today);

  const activeTasks = (tasks ?? []).map((t) => ({ id: t.id, title: t.title, domain: t.domain }));

  return (
    <div className="mx-auto max-w-lg">
      <PointsHeader
        displayName={profile.display_name ?? "there"}
        totalPoints={profile.spendable_points}
        streak={streak}
      />
      <TodayTabs tasks={taskRows} activeTasks={activeTasks} />
    </div>
  );
}

function computeStreak(rows: { completed_date: string }[], today: string): number {
  const days = new Set(rows.map((r) => r.completed_date));
  let streak = 0;
  let cursor = new Date(today);
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!days.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
