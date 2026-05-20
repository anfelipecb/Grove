/** Strips common AI task-instruction prefixes from goal titles. */
export function normalizeGoalTitle(raw: string): string {
  return raw.replace(/^Define the next \d+-minute action for:\s*/i, "").trim();
}
