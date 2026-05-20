import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

export { filterSuggestionsAgainstStatic, postProfileForSuggestions } from "@/components/onboarding-suggestions";

export function mergeLines(chips: string[], text: string): string {
  const fromText = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set([...chips, ...fromText]);
  return [...set].join("\n");
}

export function briefingGoalsFromWizard(goalChips: string[], goalsText: string): string[] {
  if (goalChips.length > 0) return goalChips.slice(0, 5);
  return mergeLines([], goalsText)
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function topDomainParams(weights: Record<LifeDomainId, number>, limit = 2): string[] {
  return [...LIFE_DOMAINS]
    .map((d) => ({ id: d.id, weight: weights[d.id] ?? 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(({ id, weight }) => `${id}:${weight}`);
}

export function buildOnboardingDoneUrl(params: {
  name: string;
  goals: string[];
  style: string;
  weights: Record<LifeDomainId, number>;
  dev?: boolean;
}): string {
  const search = new URLSearchParams();
  const name = params.name.trim();
  if (name) search.set("name", name);
  for (const goal of params.goals) {
    search.append("goals", goal);
  }
  if (params.style) search.set("style", params.style);
  for (const domain of topDomainParams(params.weights)) {
    search.append("topDomains", domain);
  }
  if (params.dev) search.set("dev", "1");
  const qs = search.toString();
  return qs ? `/onboarding/done?${qs}` : "/onboarding/done";
}

export function parseTopDomainParam(raw: string): { domain: string; pct: number } | null {
  const idx = raw.lastIndexOf(":");
  if (idx <= 0) return null;
  const domain = raw.slice(0, idx);
  const pct = Number.parseInt(raw.slice(idx + 1), 10);
  if (!domain || Number.isNaN(pct)) return null;
  return { domain, pct };
}
