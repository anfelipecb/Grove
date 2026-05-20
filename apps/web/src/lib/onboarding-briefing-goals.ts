import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import type { CoachGoalDraft, CoachSuggestedTask } from "@/components/v2/coach/types";

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((domain) => domain.id === domainId)?.label ?? "Selected domain";
}

function suggestPointValue(frequency: CoachSuggestedTask["frequency"], isRequired: boolean): number {
  if (frequency === "weekly") return isRequired ? 22 : 18;
  if (frequency === "once") return isRequired ? 18 : 14;
  return isRequired ? 12 : 10;
}

function buildDefaultTasks(goalTitle: string, domainId: LifeDomainId): CoachSuggestedTask[] {
  const label = domainLabel(domainId).toLowerCase();
  const focus = goalTitle.trim() || `your ${label} focus`;

  return [
    {
      title: `10-minute ${label} starter for ${focus}`,
      frequency: "daily",
      isRequired: true,
      pointValue: suggestPointValue("daily", true),
    },
    {
      title: `One focused block that moves ${focus} forward`,
      frequency: "weekly",
      isRequired: false,
      pointValue: suggestPointValue("weekly", false),
    },
  ];
}

export function coerceBriefingDomain(raw: string | undefined): LifeDomainId {
  const known = new Set(LIFE_DOMAINS.map((d) => d.id));
  if (raw && known.has(raw as LifeDomainId)) {
    return raw as LifeDomainId;
  }
  return "wellbeing";
}

export function buildBriefingGoalDrafts(
  goalTitles: string[],
  primaryDomain: LifeDomainId,
): CoachGoalDraft[] {
  return goalTitles.map((title, index) => {
    const key = `briefing-${index}`;
    return {
      key,
      title,
      domain: primaryDomain,
      rationale: `Starter plan for ${title.toLowerCase()}.`,
      custom: false,
      tasks: buildDefaultTasks(title, primaryDomain).map((task, taskIndex) => ({
        ...task,
        id: `${key}-task-${taskIndex}`,
        enabled: true,
      })),
    };
  });
}

export function firstStarterTask(drafts: CoachGoalDraft[]): string | null {
  for (const goal of drafts) {
    const task = goal.tasks.find((t) => t.enabled);
    if (task) return task.title;
  }
  return null;
}
