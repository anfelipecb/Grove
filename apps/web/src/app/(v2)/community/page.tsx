import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { CommunityHome } from "@/components/v2/community/community-home";
import { CommunityEntry } from "@/components/v2/community/community-entry";
import type { SharedGoal } from "@/components/v2/community/shared-goals-list";
import type { CommunityMember } from "@/components/v2/community/member-activity";
import type { UpcomingSession } from "@/components/v2/community/sessions-panel";

function getMondayISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export default async function CommunityPage() {
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
    .select("id, community_points, private_focus_notes")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("memberships")
    .select("community_id, role")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return <CommunityEntry />;
  }

  const communityId = membership.community_id;
  const isOrganizer = membership.role === "owner" || membership.role === "organizer";
  const monday = getMondayISO();

  const [
    { data: community },
    { data: members },
    { data: goals },
    { data: upcomingSessions },
  ] = await Promise.all([
    supabase.from("communities").select("id, name").eq("id", communityId).maybeSingle(),
    supabase
      .from("memberships")
      .select("profile_id, profiles(id, display_name, community_points)")
      .eq("community_id", communityId),
    supabase
      .from("goals")
      .select("id, title, domain")
      .eq("community_id", communityId)
      .eq("is_public", true),
    supabase
      .from("sessions")
      .select("id, title, starts_at")
      .eq("community_id", communityId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
  ]);

  const memberCount = (members ?? []).length;
  const goalIds = (goals ?? []).map((g) => g.id);

  const [{ data: goalTasks }, { data: userRsvps }] = await Promise.all([
    goalIds.length > 0
      ? supabase.from("tasks").select("id, goal_id").in("goal_id", goalIds)
      : Promise.resolve({ data: [] as { id: string; goal_id: string }[] }),
    upcomingSessions && upcomingSessions.length > 0
      ? supabase
          .from("attendance")
          .select("session_id, rsvp")
          .eq("profile_id", profile.id)
          .in("session_id", upcomingSessions.map((s) => s.id))
      : Promise.resolve({ data: [] as { session_id: string; rsvp: string }[] }),
  ]);

  const taskIds = (goalTasks ?? []).map((t) => t.id);
  const { data: completionsThisWeek } = taskIds.length > 0
    ? await supabase
        .from("task_completions")
        .select("task_id, profile_id, community_points_earned")
        .in("task_id", taskIds)
        .gte("completed_date", monday)
    : { data: [] as { task_id: string; profile_id: string; community_points_earned: number }[] };

  const taskToGoal = new Map<string, string>();
  for (const t of goalTasks ?? []) taskToGoal.set(t.id, t.goal_id);

  const goalContributors = new Map<string, Set<string>>();
  const goalWeeklyCompletions = new Map<string, number>();
  for (const c of completionsThisWeek ?? []) {
    const gid = taskToGoal.get(c.task_id);
    if (!gid) continue;
    if (!goalContributors.has(gid)) goalContributors.set(gid, new Set());
    goalContributors.get(gid)!.add(c.profile_id);
    goalWeeklyCompletions.set(gid, (goalWeeklyCompletions.get(gid) ?? 0) + 1);
  }

  const memberWeeklyPts = new Map<string, number>();
  const memberWeeklyTasks = new Map<string, number>();
  for (const c of completionsThisWeek ?? []) {
    memberWeeklyPts.set(c.profile_id, (memberWeeklyPts.get(c.profile_id) ?? 0) + (c.community_points_earned ?? 0));
    memberWeeklyTasks.set(c.profile_id, (memberWeeklyTasks.get(c.profile_id) ?? 0) + 1);
  }

  const rsvpMap = new Map<string, string>();
  for (const r of userRsvps ?? []) rsvpMap.set(r.session_id, r.rsvp);

  const sharedGoals: SharedGoal[] = (goals ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    domain: g.domain,
    contributorCount: goalContributors.get(g.id)?.size ?? 0,
    weeklyCompletions: goalWeeklyCompletions.get(g.id) ?? 0,
  }));

  const communityMembers: CommunityMember[] = (members ?? [])
    .map((m) => {
      const p = Array.isArray(m.profiles)
        ? (m.profiles as { id: string; display_name: string | null; community_points: number }[])[0]
        : (m.profiles as { id: string; display_name: string | null; community_points: number } | null);
      if (!p) return null;
      return {
        profileId: m.profile_id,
        displayName: p.display_name ?? "Unknown",
        communityPoints: p.community_points ?? 0,
        weeklyTasksDone: memberWeeklyTasks.get(m.profile_id) ?? 0,
        weeklyPoints: memberWeeklyPts.get(m.profile_id) ?? 0,
      };
    })
    .filter((m): m is CommunityMember & { weeklyPoints: number } => m !== null)
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
    .slice(0, 10);

  const sessions: UpcomingSession[] = (upcomingSessions ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.starts_at,
    rsvp: (rsvpMap.get(s.id) as "yes" | "no" | "maybe" | undefined) ?? null,
  }));

  const notes = profile.private_focus_notes as Record<string, unknown> | null | undefined;
  const alignmentStatus = notes?.community_alignment_status;
  const showAlignmentPrompt =
    alignmentStatus !== "skipped" && alignmentStatus !== "completed";

  return (
    <CommunityHome
      community={{ id: community?.id ?? communityId, name: community?.name ?? "Community", memberCount }}
      goals={sharedGoals}
      members={communityMembers}
      upcomingSessions={sessions}
      isOrganizer={isOrganizer}
      currentProfileId={profile.id}
      communityPoints={profile.community_points ?? 0}
      communityId={communityId}
      showAlignmentPrompt={showAlignmentPrompt}
    />
  );
}
