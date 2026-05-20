import { redirect } from "next/navigation";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { CoachExperience } from "@/components/v2/coach/coach-experience";
import { CoachWizard } from "@/components/v2/coach/coach-wizard";
import { humanizeGoalLabel } from "@/lib/coach-briefing-copy";
import { createDemoAwareServerClient } from "@/lib/supabase-server";
import { getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";

export const dynamic = "force-dynamic";

type ActiveGoalRow = {
  id: string;
  title: string;
  domain: LifeDomainId;
};

type TodayTaskRow = {
  id: string;
  title: string;
  domain: string;
};

type RecentXpRow = {
  created_at: string;
  reason: string;
};

const knownDomains = new Set(LIFE_DOMAINS.map((domain) => domain.id));

function coerceDomain(raw: string | null | undefined): LifeDomainId {
  if (raw && knownDomains.has(raw as LifeDomainId)) {
    return raw as LifeDomainId;
  }

  return "learning";
}

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ debrief?: string; planned?: string }>;
}) {
  const params = await searchParams;
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/sign-in?redirect_url=/coach");
  }

  const { client: supabase, demo } = await createDemoAwareServerClient();

  if (!demo && !isClerkConfigured()) {
    return (
      <main className="p-8 text-foreground">
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to use Coach.</p>
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
    .select("id, display_name, spendable_points, onboarding_step")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profileError) {
    return (
      <main className="p-8 text-foreground">
        <p>Could not load Coach: {profileError.message}</p>
      </main>
    );
  }

  const profileId = (profile?.id as string | undefined) ?? null;
  const displayName = (profile?.display_name as string | undefined) ?? "Member";
  const spendablePoints = (profile?.spendable_points as number | undefined) ?? 0;
  const onboardingComplete = ((profile?.onboarding_step as number | null | undefined) ?? 0) >= 5;

  let activeGoals: ActiveGoalRow[] = [];
  let todayTasks: TodayTaskRow[] = [];
  let recentXp: RecentXpRow[] = [];

  if (profileId) {
    const [
      { data: tasks, error: taskError },
      { data: goals, error: goalsError },
      { data: xpRows, error: xpError },
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, domain")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .in("frequency", ["daily", "weekly"])
        .order("created_at", { ascending: false }),
      supabase
        .from("goals")
        .select("id, title, domain")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("xp_events")
        .select("created_at, reason")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (taskError) {
      return (
        <main className="p-8 text-foreground">
          <p>Could not load Coach tasks: {taskError.message}</p>
        </main>
      );
    }

    if (xpError) {
      return (
        <main className="p-8 text-foreground">
          <p>Could not load Coach progress: {xpError.message}</p>
        </main>
      );
    }

    if (goalsError) {
      return (
        <main className="p-8 text-foreground">
          <p>Could not load active goals: {goalsError.message}</p>
        </main>
      );
    }

    activeGoals = (goals ?? []).map((goal) => ({
      id: goal.id as string,
      title: humanizeGoalLabel(goal.title as string),
      domain: coerceDomain(goal.domain as string | null | undefined),
    }));
    todayTasks = (tasks ?? []).map((task) => ({
      id: task.id as string,
      title: task.title as string,
      domain: task.domain as string,
    }));
    recentXp = (xpRows ?? []).map((row) => ({
      created_at: row.created_at as string,
      reason: row.reason as string,
    }));
  }

  const debriefPlannedCount =
    params.debrief === "1" ? Math.max(0, Number.parseInt(params.planned ?? "0", 10) || 0) : 0;

  const chatContext = {
    today: new Date().toISOString().slice(0, 10),
    topGoalTitle: activeGoals[0]?.title ?? null,
    activeGoals: activeGoals.map((goal) => ({
      title: goal.title,
      domain: goal.domain,
    })),
    todayTasks: todayTasks.map((task) => ({
      title: task.title,
      domain: task.domain,
    })),
    recentXp,
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 text-foreground sm:px-6 lg:px-8">
      {profileId ? (
        <CoachExperience
          activeGoals={activeGoals}
          chatContext={chatContext}
          demoMode={demo}
          displayName={displayName}
          hasTasks={todayTasks.length > 0}
          onboardingComplete={onboardingComplete}
          profileId={profileId}
          spendablePoints={spendablePoints}
          debriefPlannedCount={debriefPlannedCount}
        />
      ) : (
        <CoachWizard demoMode={demo} initialDisplayName={displayName} profileId={null} />
      )}
    </main>
  );
}
