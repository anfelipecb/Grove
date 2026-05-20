export type CoachQuickActionId =
  | "smallest_step"
  | "stuck_starting"
  | "dopamine_break"
  | "plan_day"
  | "yesterday_debrief"
  | "feelings_check";

export type CoachQuickAction = {
  id: CoachQuickActionId;
  label: string;
  promptSeed: string;
  sessionType: "check_in" | "stuck" | "plan_day" | "debrief" | "free_chat";
};

export const COACH_QUICK_ACTIONS: CoachQuickAction[] = [
  {
    id: "smallest_step",
    label: "Smallest next step",
    promptSeed: "Help me find the smallest next step I can start in the next 10 minutes.",
    sessionType: "check_in",
  },
  {
    id: "stuck_starting",
    label: "I'm stuck starting",
    promptSeed:
      "I'm having trouble starting. What's one tiny action I can do right now without needing motivation?",
    sessionType: "stuck",
  },
  {
    id: "dopamine_break",
    label: "Dopamine break",
    promptSeed: "I need a short reset before I get back to work. Suggest something from my dopamine menu.",
    sessionType: "check_in",
  },
  {
    id: "plan_day",
    label: "Plan my day",
    promptSeed:
      "Walk me through today: what's on my list, what should I tackle first, and what can wait until tomorrow?",
    sessionType: "plan_day",
  },
  {
    id: "yesterday_debrief",
    label: "How did yesterday go?",
    promptSeed: "Let's debrief yesterday. What went well, what slipped, and what should carry into today?",
    sessionType: "debrief",
  },
  {
    id: "feelings_check",
    label: "Check in on feelings",
    promptSeed: "I want a quick feelings check-in before I plan what to do next.",
    sessionType: "check_in",
  },
];

export function getQuickAction(id: CoachQuickActionId): CoachQuickAction | undefined {
  return COACH_QUICK_ACTIONS.find((a) => a.id === id);
}
