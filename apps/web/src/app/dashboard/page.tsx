import { getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";
import { redirect } from "next/navigation";
import { GroveDashboard, type DashboardGoalRow, type DashboardXpEventRow } from "@/components/grove-dashboard";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="p-8 text-stone-700">
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to use the dashboard.</p>
      </main>
    );
  }

  const userId = await getServerUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return (
      <main className="p-8 text-stone-700">
        <p>Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a publishable key.</p>
      </main>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, total_xp, spendable_points, private_focus_notes, onboarding_step")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    return (
      <main className="p-8 text-bark">
        <p>Could not load profile: {error.message}</p>
      </main>
    );
  }

  if (!profile || profile.onboarding_step < 5) {
    redirect("/onboarding");
  }

  const profileId = profile.id as string;

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, domain, subarea, xp_value, status")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: xpEvents } = await supabase
    .from("xp_events")
    .select("id, reason, xp, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("communities(name)")
    .eq("profile_id", profileId);

  const communityLabels =
    memberships
      ?.map((m) => {
        const raw = m.communities as unknown;
        const c = Array.isArray(raw) ? raw[0] : raw;
        return (c as { name?: string } | null)?.name;
      })
      .filter((n): n is string => Boolean(n)) ?? [];

  return (
    <GroveDashboard
      profileId={profileId}
      displayName={profile.display_name as string}
      totalXp={profile.total_xp as number}
      spendablePoints={profile.spendable_points as number}
      focusNotes={(profile.private_focus_notes ?? {}) as Record<string, unknown>}
      initialGoals={(goals ?? []) as DashboardGoalRow[]}
      initialXpEvents={(xpEvents ?? []) as DashboardXpEventRow[]}
      communityLabels={communityLabels as string[]}
    />
  );
}
