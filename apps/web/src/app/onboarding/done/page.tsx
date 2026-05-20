import { OnboardingBriefing } from "@/components/v2/onboarding/onboarding-briefing";
import { parseTopDomainParam } from "@/components/v2/onboarding/onboarding-helpers";

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default function OnboardingDonePage({
  searchParams,
}: {
  searchParams: {
    name?: string;
    goals?: string | string[];
    style?: string;
    topDomains?: string | string[];
    dev?: string;
  };
}) {
  const goals = toArray(searchParams.goals).slice(0, 5);
  const topDomains = toArray(searchParams.topDomains)
    .map(parseTopDomainParam)
    .filter((d): d is { domain: string; pct: number } => d !== null)
    .slice(0, 2);

  return (
    <OnboardingBriefing
      name={searchParams.name ?? ""}
      goals={goals}
      style={searchParams.style ?? "structured"}
      topDomains={topDomains}
      devPreview={searchParams.dev === "1"}
    />
  );
}
