import { OnboardingBriefing } from "@/components/v2/onboarding/onboarding-briefing";
import { parseTopDomainParam } from "@/components/v2/onboarding/onboarding-helpers";
import { getServerUserId } from "@/lib/clerk-auth";
import { createDemoAwareServerClient } from "@/lib/supabase-server";

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function OnboardingDonePage({
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

  const devPreview = searchParams.dev === "1";
  let profileId: string | null = null;

  if (!devPreview) {
    const userId = await getServerUserId();
    if (userId) {
      const { client: supabase } = await createDemoAwareServerClient();
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_user_id", userId)
          .maybeSingle();
        profileId = (data?.id as string | undefined) ?? null;
      }
    }
  }

  return (
    <OnboardingBriefing
      name={searchParams.name ?? ""}
      goals={goals}
      style={searchParams.style ?? "structured"}
      topDomains={topDomains}
      profileId={profileId}
      devPreview={devPreview}
    />
  );
}
