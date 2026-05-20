export type InviteStatus =
  | "pending"
  | "proposed"
  | "accepted"
  | "declined"
  | "counter_proposed"
  | "cancelled";

export type CoordinationSuggestion = {
  date: string;
  start: string;
  activityTitle: string;
  proposedDate: string;
  proposedStartTime: string;
  durationMinutes: number;
  rationale: string;
};
