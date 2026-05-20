import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PointsHeader } from "@/components/v2/shared/points-header";
import { TodayMobileShell } from "@/components/v2/today/today-mobile-shell";
import { TodayDesktop } from "@/components/v2/today/today-desktop";
import { TodayDebriefRedirect } from "@/components/v2/today/today-debrief-redirect";
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
    .select("id, display_name, spendable_points, community_points, google_calendar_token")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  // Compute Monday of current week
  const nowDate = new Date();
  const dayOfWeek = nowDate.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monday = new Date(nowDate);
  monday.setDate(nowDate.getDate() + diffToMonday);
  const mondayStr = monday.toISOString().slice(0, 10);

  const [
    { data: tasks },
    { data: topGoal },
    { data: completions },
    { data: recentCompletions },
    { data: domainCompletions },
    { data: membership },
    { count: yesterdayPlannedCount },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, domain, goal_id, is_required, is_community_task, point_value, community_point_value")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .in("frequency", ["daily", "weekly"]),
    supabase
      .from("goals")
      .select("id, title")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("task_completions")
      .select("task_id, points_earned")
      .eq("profile_id", profile.id)
      .eq("completed_date", today),
    // Last 30 days of completions to compute streak
    supabase
      .from("task_completions")
      .select("completed_date")
      .eq("profile_id", profile.id)
      .gte("completed_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("completed_date", { ascending: false }),
    // Domain points: task completions this week grouped by domain
    supabase
      .from("task_completions")
      .select("tasks(domain), points_earned")
      .eq("profile_id", profile.id)
      .gte("completed_date", mondayStr),
    // Community membership
    supabase
      .from("memberships")
      .select("community_id, communities(name)")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("scheduled_tasks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("scheduled_date", yesterday),
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

  const topGoalId = (topGoal as { id: string } | null)?.id ?? null;
  const mainTaskCandidate =
    topGoalId != null
      ? (tasks ?? []).find((t) => t.goal_id === topGoalId && !completedToday.has(t.id))
      : (tasks ?? []).find((t) => !t.is_required && !completedToday.has(t.id));
  const mainTask = mainTaskCandidate
    ? {
        id: mainTaskCandidate.id as string,
        title: mainTaskCandidate.title as string,
        completed: completedToday.has(mainTaskCandidate.id as string),
      }
    : null;

  const streak = computeStreak(recentCompletions ?? [], today);

  const doneTodayCount = completedToday.size;
  const pointsToday = (completions ?? []).reduce((sum, c) => sum + (c.points_earned ?? 0), 0);

  const activeTasks = (tasks ?? []).map((t) => ({ id: t.id, title: t.title, domain: t.domain }));

  // Compute domain points
  const domainPoints: Record<string, number> = {};
  for (const entry of domainCompletions ?? []) {
    const t = entry.tasks;
    const taskDomain = (Array.isArray(t) ? t[0]?.domain : (t as { domain: string } | null)?.domain) ?? "unknown";
    domainPoints[taskDomain] = (domainPoints[taskDomain] ?? 0) + (entry.points_earned ?? 0);
  }

  // Community pulse
  const communityId = (membership?.community_id as string | null) ?? null;
  const rawCommunities = membership?.communities as { name: string } | { name: string }[] | undefined | null;
  const communityName = (Array.isArray(rawCommunities) ? rawCommunities[0]?.name : rawCommunities?.name) ?? null;

  const [nextSessionResult, memberCountResult] = await Promise.all([
    communityId
      ? supabase
          .from("sessions")
          .select("title, starts_at")
          .eq("community_id", communityId)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    communityId
      ? supabase
          .from("memberships")
          .select("id", { count: "exact", head: true })
          .eq("community_id", communityId)
      : Promise.resolve({ count: 0 }),
  ]);

  const nextSessionTitle = (nextSessionResult.data as { title: string } | null)?.title ?? null;
  const memberCount = (memberCountResult as { count: number | null }).count ?? 0;

  const communityPulse = {
    communityName,
    memberCount,
    nextSessionTitle,
  };

  const unlockedSurpriseIds: string[] = [];

  const plannedYesterday = yesterdayPlannedCount ?? 0;

  return (
    <div>
      <TodayDebriefRedirect yesterdayPlannedCount={plannedYesterday} />
      {/* Mobile / tablet: max-w-lg centered, tabs UI */}
      <div className="mx-auto max-w-lg lg:hidden">
        <PointsHeader
          displayName={profile.display_name ?? "there"}
          totalPoints={profile.spendable_points}
          streak={streak}
        />
        <TodayMobileShell
          tasks={taskRows}
          activeTasks={activeTasks}
          profileId={profile.id}
          mainTask={mainTask}
          googleCalendarConnected={!!profile.google_calendar_token}
        />
      </div>

      {/* Desktop: full-width 3-column layout */}
      <div className="hidden px-6 py-4 lg:block">
        <div className="mb-6">
          <PointsHeader
            displayName={profile.display_name ?? "there"}
            totalPoints={profile.spendable_points}
            streak={streak}
          />
        </div>
        <TodayDesktop
          tasks={taskRows}
          activeTasks={activeTasks}
          domainPoints={domainPoints}
          doneTodayCount={doneTodayCount}
          pointsToday={pointsToday}
          streak={streak}
          communityPulse={communityPulse}
          unlockedSurpriseIds={unlockedSurpriseIds}
          profileId={profile.id}
        />
      </div>
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
