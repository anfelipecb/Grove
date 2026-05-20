/** Strips common AI task-instruction prefixes from goal titles. */
export function normalizeGoalTitle(raw: string): string {
  return raw
    .replace(/^Define the next \d+-minute action for:\s*/i, "")
    .replace(/^Define the next \d+-minute action for\s+/i, "")
    .replace(/^One \d+-minute block on\s+/i, "")
    .replace(/^Next step:\s*/i, "")
    .trim();
}
