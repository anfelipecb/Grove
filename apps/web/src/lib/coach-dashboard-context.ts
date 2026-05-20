import type { LifeDomainId } from "@grove/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStaticCoachBriefing, humanizeGoalLabel } from "@/lib/coach-briefing-copy";
import { computeXpConsistency } from "@/lib/xp-consistency";

export type CoachBriefingSnapshot = {
  activeGoals: { title: string; domain: string }[];
  todayTasks: { title: string; completed: boolean }[];
  yesterdayPlanned: number;
  yesterdayCompleted: number;
  todayScheduled: number;
  streakDays: number;
  lastJournalSnippet: string | null;
};

export type CoachDashboardContext = {
  displayName: string;
  focusNotesRaw: unknown;
  activeGoals: { title: string; domain: string }[];
  lastCompletedGoalTitle: string | null;
  xpEvents: { created_at: string; reason: string }[];
  commitments: { title: string; status: string }[];
  consistencySummary: string;
  briefing: CoachBriefingSnapshot;
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
  const briefing = buildStaticCoachBriefing(ctx);
  return { greeting: briefing.greeting, insight: briefing.insight };
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

function dateKeyOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function staticCoachBriefing(
  ctx: CoachDashboardContext,
  debriefPlannedCount = 0,
): { greeting: string; insight: string } {
  return buildStaticCoachBriefing(ctx, debriefPlannedCount);
}

export async function loadCoachDashboardContext(
  supabase: SupabaseClient,
  profileId: string,
): Promise<CoachDashboardContext | null> {
  const today = dateKeyOffset(0);
  const yesterday = dateKeyOffset(-1);

  const [
    { data: profile },
    { data: goals },
    { data: xpRows },
    { data: memberships },
    { data: tasks },
    { data: todayCompletions },
    { data: yesterdayCompletions },
    { count: yesterdayScheduledCount },
    { count: todayScheduledCount },
    { data: journalRows },
    { data: completionDates },
  ] = await Promise.all([
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
    supabase
      .from("tasks")
      .select("id, title, domain")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .in("frequency", ["daily", "weekly"]),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("profile_id", profileId)
      .eq("completed_date", today),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("profile_id", profileId)
      .eq("completed_date", yesterday),
    supabase
      .from("scheduled_tasks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("scheduled_date", yesterday),
    supabase
      .from("scheduled_tasks")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("scheduled_date", today),
    supabase
      .from("journal_entries")
      .select("content, entry_date")
      .eq("profile_id", profileId)
      .order("entry_date", { ascending: false })
      .limit(1),
    supabase
      .from("task_completions")
      .select("completed_date")
      .eq("profile_id", profileId)
      .order("completed_date", { ascending: false })
      .limit(60),
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
  const activeGoals = goalList
    .filter((g) => g.status === "active")
    .map((g) => ({ title: humanizeGoalLabel(g.title), domain: g.domain }));
  const completed = goalList.filter((g) => g.status === "completed" && g.completed_at);
  completed.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
  const lastCompletedGoalTitle = completed[0]?.title ? humanizeGoalLabel(completed[0].title) : null;

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

  const completedToday = new Set((todayCompletions ?? []).map((r) => r.task_id as string));
  const todayTasksFixed = ((tasks ?? []) as { id: string; title: string; domain: string }[]).map((t) => ({
    title: t.title,
    completed: completedToday.has(t.id),
  }));

  const yesterdayCompleted = (yesterdayCompletions ?? []).length;
  const yesterdayPlanned = yesterdayScheduledCount ?? 0;
  const todayScheduled = todayScheduledCount ?? 0;

  const uniqueDates = [...new Set((completionDates ?? []).map((r) => r.completed_date as string))].sort(
    (a, b) => b.localeCompare(a),
  );
  let streakDays = 0;
  const dateSet = new Set(uniqueDates);
  for (let i = 0; i < 365; i++) {
    const d = dateKeyOffset(-i);
    if (dateSet.has(d)) {
      streakDays += 1;
    } else if (i > 0) {
      break;
    }
  }

  const lastJournal = (journalRows ?? [])[0] as { content: string; entry_date: string } | undefined;
  const lastJournalSnippet = lastJournal?.content?.trim() ? lastJournal.content.trim() : null;

  const briefing: CoachBriefingSnapshot = {
    activeGoals,
    todayTasks: todayTasksFixed,
    yesterdayPlanned,
    yesterdayCompleted,
    todayScheduled,
    streakDays,
    lastJournalSnippet,
  };

  return {
    displayName: profile.display_name,
    focusNotesRaw: profile.private_focus_notes,
    activeGoals,
    lastCompletedGoalTitle,
    xpEvents,
    commitments,
    consistencySummary,
    briefing,
  };
}
