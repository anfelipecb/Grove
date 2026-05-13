import type { SupabaseClient } from "@supabase/supabase-js";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

export type CommunityBalanceContext = {
  hasCommunity: boolean;
  communityId: string | null;
  communityName: string | null;
  memberCount: number;
  sharedGoalCount: number;
  tasks: Array<{ title: string; domain: string; frequency: string; is_community_task: boolean }>;
  upcomingSessions: Array<{ id: string; title: string; startsAt: string; rsvp: string | null }>;
};

export type CommunityBalancePayload = {
  hasCommunity: boolean;
  headline: string;
  balanceTips: string[];
  socialNudges: string[];
  suggestedMicroTasks: Array<{
    title: string;
    domain: LifeDomainId;
    rationale: string;
    is_community_task?: boolean;
  }>;
};

function coerceDomain(raw: string): LifeDomainId {
  const allowed = new Set(LIFE_DOMAINS.map((d) => d.id));
  return allowed.has(raw as LifeDomainId) ? (raw as LifeDomainId) : "community";
}

export async function loadCommunityBalanceContext(
  supabase: SupabaseClient,
  profileId: string,
): Promise<CommunityBalanceContext> {
  const { data: membership } = await supabase
    .from("memberships")
    .select("community_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const communityId = (membership?.community_id as string | undefined) ?? null;

  const [{ data: tasks }, horizonISO] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, domain, frequency, is_community_task")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .limit(48),
    Promise.resolve((() => {
      const h = new Date();
      h.setDate(h.getDate() + 14);
      return h.toISOString();
    })()),
  ]);

  if (!communityId) {
    return {
      hasCommunity: false,
      communityId: null,
      communityName: null,
      memberCount: 0,
      sharedGoalCount: 0,
      tasks: (tasks ?? []).map((t) => ({
        title: String(t.title ?? ""),
        domain: String(t.domain ?? ""),
        frequency: String(t.frequency ?? ""),
        is_community_task: Boolean(t.is_community_task),
      })),
      upcomingSessions: [],
    };
  }

  const [{ data: community }, { count: memberCount }, { count: sharedGoalCount }, { data: upcomingSessions }] =
    await Promise.all([
      supabase.from("communities").select("name").eq("id", communityId).maybeSingle(),
      supabase.from("memberships").select("id", { count: "exact", head: true }).eq("community_id", communityId),
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId)
        .eq("is_public", true),
      supabase
        .from("sessions")
        .select("id, title, starts_at")
        .eq("community_id", communityId)
        .gte("starts_at", new Date().toISOString())
        .lte("starts_at", horizonISO)
        .order("starts_at", { ascending: true })
        .limit(6),
    ]);

  const sessionRows = upcomingSessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id);

  const { data: rsvps } =
    sessionIds.length > 0
      ? await supabase.from("attendance").select("session_id, rsvp").eq("profile_id", profileId).in("session_id", sessionIds)
      : { data: [] as { session_id: string; rsvp: string }[] };

  const rsvpMap = new Map<string, string>();
  for (const r of rsvps ?? []) rsvpMap.set(r.session_id, r.rsvp);

  return {
    hasCommunity: true,
    communityId,
    communityName: (community?.name as string | undefined) ?? "Community",
    memberCount: memberCount ?? 0,
    sharedGoalCount: sharedGoalCount ?? 0,
    tasks: (tasks ?? []).map((t) => ({
      title: String(t.title ?? ""),
      domain: String(t.domain ?? ""),
      frequency: String(t.frequency ?? ""),
      is_community_task: Boolean(t.is_community_task),
    })),
    upcomingSessions: sessionRows.map((s) => ({
      id: s.id as string,
      title: s.title as string,
      startsAt: s.starts_at as string,
      rsvp: rsvpMap.get(s.id as string) ?? null,
    })),
  };
}

/** Crisis scan across lightweight planning strings only (no clinical framing). */
export function communityBalanceCrisisBlob(ctx: CommunityBalanceContext): string {
  const lines = [
    ctx.communityName ?? "",
    ...ctx.tasks.map((t) => t.title),
    ...ctx.upcomingSessions.map((s) => s.title),
  ];
  return lines.join("\n").slice(0, 8000);
}

export function buildStaticCommunityBalance(ctx: CommunityBalanceContext): CommunityBalancePayload {
  if (!ctx.hasCommunity || !ctx.communityId) {
    return {
      hasCommunity: false,
      headline: "Community pulse",
      balanceTips: [],
      socialNudges: ["Join a community from the Community tab when you’re ready to sync up with others."],
      suggestedMicroTasks: [],
    };
  }

  const personalLoad = ctx.tasks.filter((t) => !t.is_community_task).length;
  const communityLoad = ctx.tasks.filter((t) => t.is_community_task).length;

  const balanceTips: string[] = [];
  if (personalLoad >= 10) {
    balanceTips.push(
      `You have ${personalLoad} active personal tasks—protect one lighter slot before stacking more community work.`,
    );
  } else if (personalLoad <= 3 && ctx.sharedGoalCount > 0 && communityLoad === 0) {
    balanceTips.push("Room on your plate—pick one shared goal bite so your crew stays visible.");
  }

  if (communityLoad > 0 && personalLoad > 8) {
    balanceTips.push("Community reps count—keep today’s checklist tiny so shared tasks feel doable.");
  }

  const socialNudges: string[] = [];
  const next = ctx.upcomingSessions[0];
  if (next) {
    const when = new Date(next.startsAt).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    if (next.rsvp === "yes") {
      socialNudges.push(`You’re marked yes for “${next.title}” (${when}).`);
    } else if (next.rsvp === "maybe") {
      socialNudges.push(`You’re tentative on “${next.title}” (${when})—flip to yes/no when energy clears.`);
    } else {
      socialNudges.push(`Next hang: “${next.title}” (${when}). RSVP when you can so hosts plan ahead.`);
    }
  } else {
    socialNudges.push(`No sessions scheduled soon in ${ctx.communityName}.`);
  }

  const suggestedMicroTasks: CommunityBalancePayload["suggestedMicroTasks"] = [];
  if (ctx.sharedGoalCount > 0 && communityLoad < 2) {
    suggestedMicroTasks.push({
      title: `15-minute helping block for ${ctx.communityName}`,
      domain: "community",
      rationale: "Tiny reps beat heroic bursts—keep your share visible.",
      is_community_task: true,
    });
  }

  return {
    hasCommunity: true,
    headline: `Showing up for ${ctx.communityName}`,
    balanceTips,
    socialNudges,
    suggestedMicroTasks,
  };
}

export function sanitizeGroqMicroTasks(
  raw: CommunityBalancePayload["suggestedMicroTasks"],
): CommunityBalancePayload["suggestedMicroTasks"] {
  return raw.slice(0, 3).map((t) => ({
    title: t.title.slice(0, 140),
    domain: coerceDomain(t.domain),
    rationale: t.rationale.slice(0, 200),
    is_community_task: t.is_community_task,
  }));
}
