import { redirect } from "next/navigation";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { CoachCheckin } from "@/components/v2/coach/coach-checkin";
import { CoachWizard } from "@/components/v2/coach/coach-wizard";
import { createDemoAwareServerClient } from "@/lib/supabase-server";
import { getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";

export const dynamic = "force-dynamic";

type ActiveGoalRow = {
  id: string;
  title: string;
  domain: LifeDomainId;
};

const knownDomains = new Set(LIFE_DOMAINS.map((domain) => domain.id));

function coerceDomain(raw: string | null | undefined): LifeDomainId {
  if (raw && knownDomains.has(raw as LifeDomainId)) {
    return raw as LifeDomainId;
  }

  return "learning";
}

export default async function CoachPage() {
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
    .select("id, display_name, spendable_points")
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

  let taskCount = 0;
  let activeGoals: ActiveGoalRow[] = [];

  if (profileId) {
    const [{ count, error: taskError }, { data: goals, error: goalsError }] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
      supabase
        .from("goals")
        .select("id, title, domain")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    if (taskError) {
      return (
        <main className="p-8 text-foreground">
          <p>Could not load Coach tasks: {taskError.message}</p>
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

    taskCount = count ?? 0;
    activeGoals = (goals ?? []).map((goal) => ({
      id: goal.id as string,
      title: goal.title as string,
      domain: coerceDomain(goal.domain as string | null | undefined),
    }));
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 text-foreground sm:px-6 lg:px-8">
      {taskCount > 0 && profileId ? (
        <CoachCheckin
          activeGoals={activeGoals}
          demoMode={demo}
          displayName={displayName}
          profileId={profileId}
          spendablePoints={spendablePoints}
        />
      ) : (
        <CoachWizard demoMode={demo} initialDisplayName={displayName} profileId={profileId} />
      )}
    </main>
  );
}
