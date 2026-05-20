import { normalizeGoalTitle } from "@/lib/normalize-goal-title";
import type { CoachDashboardContext } from "@/lib/coach-dashboard-context";

const MAX_GREETING_CHARS = 96;
const MAX_INSIGHT_CHARS = 140;

export function humanizeGoalLabel(raw: string): string {
  return normalizeGoalTitle(raw).replace(/\s+/g, " ").trim();
}

export function clampBriefingLine(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${base}…`;
}

/** Static briefing: warm recap, no questions, no task-instruction phrasing. */
export function buildStaticCoachBriefing(
  ctx: CoachDashboardContext,
  debriefPlannedCount = 0,
): { greeting: string; insight: string } {
  const firstName = ctx.displayName.split(/\s+/)[0] || ctx.displayName;
  const primaryGoal = ctx.activeGoals[0]?.title
    ? humanizeGoalLabel(ctx.activeGoals[0].title)
    : null;
  const { briefing } = ctx;

  let greeting = `Hey ${firstName}.`;
  if (primaryGoal) {
    greeting = `Hey ${firstName} — you're still building ${primaryGoal}.`;
  }

  let insight = "";
  if (debriefPlannedCount > 0) {
    insight = `Yesterday you planned ${debriefPlannedCount} task${debriefPlannedCount === 1 ? "" : "s"}. When you're ready, say how it went.`;
  } else if (briefing.yesterdayCompleted > 0) {
    const n = briefing.yesterdayCompleted;
    insight = `Yesterday you finished ${n} task${n === 1 ? "" : "s"}. Nice momentum — keep that thread going today.`;
  } else if (briefing.streakDays >= 2) {
    insight = `${briefing.streakDays}-day streak. You're showing up — one small win today keeps it alive.`;
  } else if (briefing.todayTasks.some((t) => t.completed)) {
    const done = briefing.todayTasks.filter((t) => t.completed).length;
    insight = `You already checked off ${done} today. Good start.`;
  } else if (ctx.lastCompletedGoalTitle) {
    insight = `Latest win: ${humanizeGoalLabel(ctx.lastCompletedGoalTitle)}. ${ctx.consistencySummary}`;
  } else if (briefing.lastJournalSnippet) {
    insight = `From your last reflection: ${briefing.lastJournalSnippet.slice(0, 100)}${briefing.lastJournalSnippet.length > 100 ? "…" : ""}`;
  } else {
    insight = ctx.consistencySummary;
  }

  return {
    greeting: clampBriefingLine(greeting, MAX_GREETING_CHARS),
    insight: clampBriefingLine(insight, MAX_INSIGHT_CHARS),
  };
}

export function sanitizeAiBriefing(
  greeting: string,
  insight: string,
  fallback: { greeting: string; insight: string },
): { greeting: string; insight: string } {
  const badPattern =
    /smallest next step|25-minute|define the next|what is the|what's the|what are you/i;
  const g = greeting.trim();
  const i = insight.trim();
  const useFallbackGreeting = g.length === 0 || g.length > MAX_GREETING_CHARS || badPattern.test(g);
  const useFallbackInsight = i.length > MAX_INSIGHT_CHARS || badPattern.test(i);
  return {
    greeting: clampBriefingLine(
      useFallbackGreeting ? fallback.greeting : g,
      MAX_GREETING_CHARS,
    ),
    insight: clampBriefingLine(useFallbackInsight ? fallback.insight : i, MAX_INSIGHT_CHARS),
  };
}
