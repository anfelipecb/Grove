import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

export type ProposedTask = {
  title: string;
  frequency: "daily" | "weekly" | "once";
  isRequired?: boolean;
};

export type ProposedGoal = {
  title: string;
  domain: LifeDomainId;
  tasks: ProposedTask[];
};

export type CoachAction =
  | {
      type: "propose_setup";
      goals: ProposedGoal[];
    }
  | {
      type: "load_check";
      activeGoals: number;
      openTasksToday: number;
      verdict: "ok" | "heavy" | "too_much";
      suggestion: string;
    }
  | { type: "suggest_find_time" };

const VALID_DOMAINS = new Set(LIFE_DOMAINS.map((d) => d.id));

export function computeLoadCheck(input: {
  activeGoalCount: number;
  openTaskCount: number;
}): Extract<CoachAction, { type: "load_check" }> {
  const { activeGoalCount, openTaskCount } = input;
  let verdict: "ok" | "heavy" | "too_much" = "ok";
  let suggestion = "Your plate looks manageable. One small win today is enough.";

  if (activeGoalCount >= 6 || openTaskCount >= 10) {
    verdict = "too_much";
    suggestion = "You have a lot in motion. Pick one goal to focus on this week before adding more.";
  } else if (activeGoalCount >= 4 || openTaskCount >= 6) {
    verdict = "heavy";
    suggestion = "This is a full week. Consider pausing a goal or moving tasks to tomorrow.";
  }

  return {
    type: "load_check",
    activeGoals: activeGoalCount,
    openTasksToday: openTaskCount,
    verdict,
    suggestion,
  };
}

export function shouldForceLoadCheck(activeGoalCount: number, openTaskCount: number): boolean {
  return activeGoalCount >= 4 || openTaskCount >= 6;
}

export function parseCoachActionsFromJson(raw: unknown): CoachAction[] {
  if (!raw || typeof raw !== "object") return [];
  const actions = (raw as { actions?: unknown }).actions;
  if (!Array.isArray(actions)) return [];

  const out: CoachAction[] = [];
  for (const item of actions) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    if (a.type === "suggest_find_time") {
      out.push({ type: "suggest_find_time" });
      continue;
    }
    if (a.type === "load_check" && typeof a.suggestion === "string") {
      out.push({
        type: "load_check",
        activeGoals: Number(a.activeGoals) || 0,
        openTasksToday: Number(a.openTasksToday) || 0,
        verdict:
          a.verdict === "heavy" || a.verdict === "too_much" || a.verdict === "ok" ? a.verdict : "ok",
        suggestion: a.suggestion.slice(0, 200),
      });
      continue;
    }
    if (a.type === "propose_setup" && Array.isArray(a.goals)) {
      const goals: ProposedGoal[] = [];
      for (const g of a.goals.slice(0, 2)) {
        if (!g || typeof g !== "object") continue;
        const goal = g as Record<string, unknown>;
        const domain = typeof goal.domain === "string" && VALID_DOMAINS.has(goal.domain as LifeDomainId)
          ? (goal.domain as LifeDomainId)
          : "wellbeing";
        const title = typeof goal.title === "string" ? goal.title.trim().slice(0, 120) : "";
        if (!title) continue;
        const tasks: ProposedTask[] = [];
        if (Array.isArray(goal.tasks)) {
          for (const t of goal.tasks.slice(0, 4)) {
            if (!t || typeof t !== "object") continue;
            const task = t as Record<string, unknown>;
            const tTitle = typeof task.title === "string" ? task.title.trim().slice(0, 140) : "";
            if (!tTitle) continue;
            const freq =
              task.frequency === "weekly" || task.frequency === "once" ? task.frequency : "daily";
            tasks.push({
              title: tTitle,
              frequency: freq,
              isRequired: Boolean(task.isRequired),
            });
          }
        }
        if (tasks.length === 0) {
          tasks.push({ title: `First step: ${title}`, frequency: "daily", isRequired: true });
        }
        goals.push({ title, domain, tasks });
      }
      if (goals.length > 0) out.push({ type: "propose_setup", goals });
    }
  }
  return out.slice(0, 3);
}

export function fallbackProposeFromMessage(userMessage: string): CoachAction | null {
  const trimmed = userMessage.trim();
  if (trimmed.length < 8) return null;
  const lower = trimmed.toLowerCase();
  const intent =
    lower.includes("want") ||
    lower.includes("need") ||
    lower.includes("goal") ||
    lower.includes("start") ||
    lower.includes("exercise") ||
    lower.includes("learn");
  if (!intent) return null;

  const title = trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
  return {
    type: "propose_setup",
    goals: [
      {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        domain: "wellbeing",
        tasks: [
          { title: "One 25-minute block on the smallest step", frequency: "daily", isRequired: true },
          { title: "Prep what you need the night before", frequency: "weekly", isRequired: false },
        ],
      },
    ],
  };
}
