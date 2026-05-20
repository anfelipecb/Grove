import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { CommunityGate } from "@/components/v2/community/community-gate";
import { CommunityHome } from "@/components/v2/community/community-home";
import { CommunityEntry } from "@/components/v2/community/community-entry";
import { hasCommunityAccess } from "@grove/core";
import type { SharedGoal } from "@/components/v2/community/shared-goals-list";
import type { CommunityMember } from "@/components/v2/community/member-activity";
import type { UpcomingSession } from "@/components/v2/community/sessions-panel";
import type {
  CommunityInviteView,
  CommunityPlanView,
} from "@/components/v2/community/buddy-coordination-panel";

export const dynamic = "force-dynamic";

function getMondayISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

type InviteRow = {
  id: string;
  community_id: string;
  inviter_profile_id: string;
  invitee_profile_id: string | null;
  invitee_email: string;
  activity_title: string;
  message: string | null;
  goal_context: string | null;
  proposed_date: string | null;
  proposed_start_time: string | null;
  duration_minutes: number;
  status: "pending" | "proposed" | "accepted" | "declined" | "canceled";
  counter_date: string | null;
  counter_start_time: string | null;
  response_note: string | null;
};

async function loadCoordinationData(args: {
  profileId: string;
  profileEmail: string | null;
  communityId?: string;
  fallbackSupabase: SupabaseClient;
}) {
  const supabase = createServiceSupabaseClient() ?? args.fallbackSupabase;

  const sentPromise = supabase
    .from("community_invites")
    .select(
      "id, community_id, inviter_profile_id, invitee_profile_id, invitee_email, activity_title, message, goal_context, proposed_date, proposed_start_time, duration_minutes, status, counter_date, counter_start_time, response_note",
    )
    .eq("inviter_profile_id", args.profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const receivedByProfilePromise = supabase
    .from("community_invites")
    .select(
      "id, community_id, inviter_profile_id, invitee_profile_id, invitee_email, activity_title, message, goal_context, proposed_date, proposed_start_time, duration_minutes, status, counter_date, counter_start_time, response_note",
    )
    .eq("invitee_profile_id", args.profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const receivedByEmailPromise = args.profileEmail
    ? supabase
        .from("community_invites")
        .select(
          "id, community_id, inviter_profile_id, invitee_profile_id, invitee_email, activity_title, message, goal_context, proposed_date, proposed_start_time, duration_minutes, status, counter_date, counter_start_time, response_note",
        )
        .ilike("invitee_email", args.profileEmail)
        .order("created_at", { ascending: false })
        .limit(20)
    : Promise.resolve({ data: [] as InviteRow[] });

  const [{ data: sent }, { data: receivedByProfile }, { data: receivedByEmail }] = await Promise.all([
    sentPromise,
    receivedByProfilePromise,
    receivedByEmailPromise,
  ]);

  const inviteMap = new Map<string, InviteRow>();
  for (const row of [...(sent ?? []), ...(receivedByProfile ?? []), ...(receivedByEmail ?? [])]) {
    inviteMap.set(row.id as string, row as InviteRow);
  }

  const inviteRows = Array.from(inviteMap.values());
  const communityIds = new Set<string>();
  const profileIds = new Set<string>([args.profileId]);
  for (const invite of inviteRows) {
    communityIds.add(invite.community_id);
    profileIds.add(invite.inviter_profile_id);
    if (invite.invitee_profile_id) profileIds.add(invite.invitee_profile_id);
  }

  const [{ data: communities }, { data: profiles }] = await Promise.all([
    communityIds.size > 0
      ? supabase.from("communities").select("id, name, slug, description").in("id", Array.from(communityIds))
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string; description: string | null }[] }),
    profileIds.size > 0
      ? supabase.from("profiles").select("id, display_name").in("id", Array.from(profileIds))
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
  ]);

  const communityMap = new Map((communities ?? []).map((community) => [community.id as string, community]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, profile.display_name ?? "Member"]));

  const invites: CommunityInviteView[] = inviteRows
    .filter((invite) => !args.communityId || invite.community_id === args.communityId)
    .map((invite) => ({
      id: invite.id,
      communityId: invite.community_id,
      communityName: communityMap.get(invite.community_id)?.name ?? "Community",
      inviterName: profileMap.get(invite.inviter_profile_id) ?? "Member",
      inviteeEmail: invite.invitee_email,
      activityTitle: invite.activity_title,
      message: invite.message,
      goalContext: invite.goal_context,
      proposedDate: invite.proposed_date,
      proposedStartTime: invite.proposed_start_time,
      durationMinutes: invite.duration_minutes,
      status: invite.status,
      counterDate: invite.counter_date,
      counterStartTime: invite.counter_start_time,
      responseNote: invite.response_note,
      isIncoming: invite.inviter_profile_id !== args.profileId,
      isInviter: invite.inviter_profile_id === args.profileId,
    }));

  let plans: CommunityPlanView[] = [];
  if (args.communityId) {
    const { data: participantRows } = await supabase
      .from("community_plan_participants")
      .select("plan_id")
      .eq("profile_id", args.profileId);

    const planIds = (participantRows ?? []).map((row) => row.plan_id as string);
    if (planIds.length > 0) {
      const { data: rawPlans } = await supabase
        .from("community_plans")
        .select("id, community_id, title, scheduled_date, start_time, duration_minutes")
        .eq("community_id", args.communityId)
        .in("id", planIds)
        .eq("status", "confirmed")
        .order("scheduled_date", { ascending: true })
        .limit(10);

      const filteredPlanIds = (rawPlans ?? []).map((plan) => plan.id as string);
      const { data: planParticipants } = filteredPlanIds.length
        ? await supabase
            .from("community_plan_participants")
            .select("plan_id, profile_id")
            .in("plan_id", filteredPlanIds)
        : { data: [] as { plan_id: string; profile_id: string }[] };

      plans = (rawPlans ?? []).map((plan) => ({
        id: plan.id as string,
        communityName: communityMap.get(plan.community_id as string)?.name ?? "Community",
        title: plan.title as string,
        scheduledDate: plan.scheduled_date as string,
        startTime: plan.start_time as string,
        durationMinutes: plan.duration_minutes as number,
        participantNames: (planParticipants ?? [])
          .filter((participant) => participant.plan_id === plan.id)
          .map((participant) => profileMap.get(participant.profile_id as string) ?? "Member"),
      }));
    }
  }

  if (!args.communityId) {
    const { data: recentCommunities } = await supabase
      .from("communities")
      .select("id, name, slug, description")
      .order("created_at", { ascending: false })
      .limit(6);
    return {
      invites,
      plans,
      discoverableCommunities: (recentCommunities ?? []).map((community) => ({
        id: community.id as string,
        name: community.name as string,
        slug: community.slug as string,
        description: (community.description as string | null | undefined) ?? null,
        })),
    };
  }

  return { invites, plans, discoverableCommunities: [] };
}

export default async function CommunityPage() {
  noStore();
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
    .select("id, email, community_points, private_focus_notes, total_xp")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  const totalXp = (profile.total_xp as number | undefined) ?? 0;
  if (!hasCommunityAccess(totalXp)) {
    return <CommunityGate totalXp={totalXp} />;
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("community_id, role")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    const { invites, discoverableCommunities } = await loadCoordinationData({
      profileId: profile.id as string,
      profileEmail: (profile.email as string | null | undefined) ?? null,
      fallbackSupabase: supabase,
    });
    return <CommunityEntry pendingInvites={invites.filter((invite) => invite.isIncoming)} discoverableCommunities={discoverableCommunities} />;
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
  const { invites, plans } = await loadCoordinationData({
    profileId: profile.id as string,
    profileEmail: (profile.email as string | null | undefined) ?? null,
    communityId,
    fallbackSupabase: supabase,
  });

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
      invites={invites}
      plans={plans}
    />
  );
}
