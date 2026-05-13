export { filterSuggestionsAgainstStatic, postProfileForSuggestions } from "@/components/onboarding-suggestions";

export function mergeLines(chips: string[], text: string): string {
  const fromText = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set([...chips, ...fromText]);
  return [...set].join("\n");
}
