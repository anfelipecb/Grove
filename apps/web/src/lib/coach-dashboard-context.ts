import type { LifeDomainId } from "@grove/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeXpConsistency } from "@/lib/xp-consistency";

export type CoachDashboardContext = {
  displayName: string;
  focusNotesRaw: unknown;
  activeGoals: { title: string; domain: string }[];
  lastCompletedGoalTitle: string | null;
  xpEvents: { created_at: string; reason: string }[];
  commitments: { title: string; status: string }[];
  consistencySummary: string;
};

export async function assertProfileOwnedByUser(
  supabase: SupabaseClient,
  profileId: string,
  clerkUserId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  return Boolean(data?.id);
}

/** Strings derived from member data for crisis scanning before calling Groq. */
export function coachCrisisScanParts(ctx: CoachDashboardContext): string[] {
  const parts: string[] = [];
  if (ctx.focusNotesRaw != null) {
    try {
      parts.push(typeof ctx.focusNotesRaw === "string" ? ctx.focusNotesRaw : JSON.stringify(ctx.focusNotesRaw));
    } catch {
      parts.push(String(ctx.focusNotesRaw));
    }
  }
  for (const g of ctx.activeGoals) {
    parts.push(g.title);
  }
  if (ctx.lastCompletedGoalTitle) {
    parts.push(ctx.lastCompletedGoalTitle);
  }
  for (const c of ctx.commitments) {
    parts.push(c.title);
  }
  for (const e of ctx.xpEvents.slice(0, 15)) {
    parts.push(e.reason);
  }
  return parts.filter((p) => p.trim().length > 0);
}

export function staticCoachGreeting(ctx: CoachDashboardContext): { greeting: string; insight: string } {
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const firstGoal = ctx.activeGoals[0]?.title;
  let greeting = `Good ${tod}, ${ctx.displayName}.`;
  if (firstGoal) {
    greeting += ` Your next queued target: ${firstGoal}.`;
  } else {
    greeting += ` Add one small target when you're ready.`;
  }
  const lastDone = ctx.lastCompletedGoalTitle;
  let insight = ctx.consistencySummary;
  if (lastDone) {
    insight = `Latest win: ${lastDone}. ${ctx.consistencySummary}`;
  }
  return { greeting, insight };
}

export function staticCoachSuggestions(ctx: CoachDashboardContext): {
  title: string;
  domain: LifeDomainId;
  rationale: string;
}[] {
  return ctx.activeGoals.slice(0, 3).map((g) => ({
    title: `Next step: ${g.title}`,
    domain: g.domain as LifeDomainId,
    rationale: "Based on your active targets — tap Add to confirm in the form.",
  }));
}

export async function loadCoachDashboardContext(
  supabase: SupabaseClient,
  profileId: string,
): Promise<CoachDashboardContext | null> {
  const [{ data: profile }, { data: goals }, { data: xpRows }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("display_name, private_focus_notes").eq("id", profileId).maybeSingle(),
    supabase
      .from("goals")
      .select("title, domain, status, completed_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("xp_events")
      .select("created_at, reason")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("memberships").select("community_id").eq("profile_id", profileId),
  ]);

  if (!profile?.display_name) {
    return null;
  }

  const goalList = (goals ?? []) as {
    title: string;
    domain: string;
    status: string;
    completed_at: string | null;
  }[];
  const activeGoals = goalList.filter((g) => g.status === "active").map((g) => ({ title: g.title, domain: g.domain }));
  const completed = goalList.filter((g) => g.status === "completed" && g.completed_at);
  completed.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
  const lastCompletedGoalTitle = completed[0]?.title ?? null;

  const xpEvents = ((xpRows ?? []) as { created_at: string; reason: string }[]).map((e) => ({
    created_at: e.created_at,
    reason: e.reason,
  }));

  const communityIds = [...new Set((memberships ?? []).map((m) => m.community_id).filter(Boolean))] as string[];
  let commitments: { title: string; status: string }[] = [];
  if (communityIds.length > 0) {
    const { data: commRows } = await supabase
      .from("commitments")
      .select("title, status")
      .in("community_id", communityIds)
      .eq("status", "active")
      .limit(15);
    commitments = (commRows ?? []) as { title: string; status: string }[];
  }

  const { message: consistencySummary } = computeXpConsistency(xpEvents);

  return {
    displayName: profile.display_name,
    focusNotesRaw: profile.private_focus_notes,
    activeGoals,
    lastCompletedGoalTitle,
    xpEvents,
    commitments,
    consistencySummary,
  };
}
