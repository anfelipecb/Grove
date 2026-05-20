import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { GoalsView } from "@/components/v2/goals/goals-view";
import type { GoalCardData, GoalTask } from "@/components/v2/goals/goal-card";
import { getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";
import { createDemoAwareServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const knownDomains = new Set(LIFE_DOMAINS.map((domain) => domain.id));

type GoalRow = {
  id: string;
  title: string;
  domain: string | null;
};

type TaskRow = {
  id: string;
  goal_id: string | null;
  title: string;
  domain: string;
  is_required: boolean;
  is_community_task: boolean;
  point_value: number;
  community_point_value: number | null;
  preferred_time: string | null;
  frequency: string;
};

function getMondayISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function coerceDomain(raw: string | null | undefined): LifeDomainId {
  if (raw && knownDomains.has(raw as LifeDomainId)) {
    return raw as LifeDomainId;
  }

  return "learning";
}

function normalizeTask(task: TaskRow, completedToday: Set<string>, completedThisWeek: Set<string>): GoalTask {
  return {
    id: task.id,
    title: task.title,
    domain: task.domain,
    is_required: task.is_required,
    is_community_task: task.is_community_task,
    point_value: task.point_value,
    community_point_value: task.community_point_value ?? 0,
    preferred_time: task.preferred_time,
    frequency: task.frequency === "daily" || task.frequency === "weekly" ? task.frequency : "once",
    completedToday: completedToday.has(task.id),
    completedThisWeek: completedThisWeek.has(task.id),
  };
}

export default async function GoalsPage() {
  noStore();

  const userId = await getServerUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/goals");
  }

  const { client: supabase, demo } = await createDemoAwareServerClient();

  if (!demo && !isClerkConfigured()) {
    return (
      <main className="p-8 text-foreground">
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to use Goals.</p>
      </main>
    );
  }

  if (!supabase) {
    return (
      <main className="p-8 text-foreground">
        <p>Supabase is not configured.</p>
      </main>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profileError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load Goals: {profileError.message}</p>
      </main>
    );
  }

  if (!profile) {
    redirect("/sign-in");
  }

  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("id, title, domain")
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (goalsError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load active goals: {goalsError.message}</p>
      </main>
    );
  }

  const goalRows = (goals ?? []) as GoalRow[];
  const goalIds = goalRows.map((goal) => goal.id);

  const monday = getMondayISO();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const [
    { data: tasks, error: tasksError },
    { data: completions, error: completionsError },
    { data: completions30d, error: completions30dError },
    { data: xpRows, error: xpError },
  ] = await Promise.all([
    goalIds.length > 0
      ? supabase
          .from("tasks")
          .select("id, goal_id, title, domain, is_required, is_community_task, point_value, community_point_value, preferred_time, frequency")
          .in("goal_id", goalIds)
          .eq("status", "active")
          .order("is_required", { ascending: false })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as TaskRow[], error: null }),
    goalIds.length > 0
      ? supabase
          .from("task_completions")
          .select("task_id, completed_date")
          .eq("profile_id", profile.id)
          .gte("completed_date", monday)
      : Promise.resolve({ data: [] as { task_id: string; completed_date: string }[], error: null }),
    supabase
      .from("task_completions")
      .select("task_id, completed_date, tasks!inner(domain)")
      .eq("profile_id", profile.id)
      .gte("completed_date", thirtyDaysAgoStr),
    supabase
      .from("xp_events")
      .select("xp, created_at")
      .eq("profile_id", profile.id)
      .gte("created_at", `${thirtyDaysAgoStr}T00:00:00`),
  ]);

  if (tasksError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load goal tasks: {tasksError.message}</p>
      </main>
    );
  }

  if (completionsError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load task completions: {completionsError.message}</p>
      </main>
    );
  }

  if (completions30dError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load progress history: {completions30dError.message}</p>
      </main>
    );
  }

  if (xpError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load XP history: {xpError.message}</p>
      </main>
    );
  }

  const monthlyXp = ((xpRows ?? []) as { xp: number }[]).reduce((sum, row) => sum + (row.xp ?? 0), 0);

  const completedToday = new Set<string>();
  const completedThisWeek = new Set<string>();

  for (const completion of completions ?? []) {
    completedThisWeek.add(completion.task_id);
    if (completion.completed_date === today) {
      completedToday.add(completion.task_id);
    }
  }

  const tasksByGoal = new Map<string, GoalTask[]>();
  for (const task of (tasks ?? []) as TaskRow[]) {
    if (!task.goal_id) continue;
    const group = tasksByGoal.get(task.goal_id) ?? [];
    group.push(normalizeTask(task, completedToday, completedThisWeek));
    tasksByGoal.set(task.goal_id, group);
  }

  const initialGoals: GoalCardData[] = goalRows.map((goal) => ({
    id: goal.id,
    title: goal.title,
    domain: coerceDomain(goal.domain),
    tasks: tasksByGoal.get(goal.id) ?? [],
  }));

  const completionsWithDomain = (completions30d ?? []).map((row) => {
    const join = row.tasks as { domain?: string | null } | null;
    return {
      task_id: row.task_id as string,
      completed_date: row.completed_date as string,
      domain: coerceDomain(join?.domain),
    };
  });

  return (
    <GoalsView
      demoMode={demo}
      displayName={(profile.display_name as string | null | undefined) ?? "Member"}
      initialGoals={initialGoals}
      profileId={profile.id as string}
      completions30d={completionsWithDomain}
      monthlyXp={monthlyXp}
      today={today}
    />
  );
}
