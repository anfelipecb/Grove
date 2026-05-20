import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntakeDraft, MemberProfileCard } from "@grove/core";
import type { LifeDomainId } from "@grove/core";

export type OnboardingSaveInput = {
  clerkUserId: string;
  displayName: string;
  email: string | null;
  intake: IntakeDraft;
  profileCard: MemberProfileCard;
  xpDomainWeights: Record<LifeDomainId, number>;
  isAssessment: boolean;
};

export type OnboardingSaveResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string; rlsBlocked?: boolean };

export function isRlsPolicyError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("row-level security") || m.includes("violates row-level security");
}

export async function runOnboardingSave(
  supabase: SupabaseClient,
  input: OnboardingSaveInput,
): Promise<OnboardingSaveResult> {
  const { clerkUserId, displayName, email, intake, profileCard, xpDomainWeights, isAssessment } = input;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        display_name: displayName,
        email,
        onboarding_step: 5,
        xp_domain_weights: xpDomainWeights,
        private_focus_notes: {
          focus_disclosure: intake.focusDisclosure ?? "",
          support_style: intake.supportStyle,
        },
        public_support_preferences: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" },
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      error: profileError?.message ?? "Profile upsert failed.",
      rlsBlocked: isRlsPolicyError(profileError?.message),
    };
  }

  const profileId = profile.id as string;

  const { error: onboardError } = await supabase.from("onboarding_responses").insert({
    profile_id: profileId,
    responses: intake,
    profile_card: profileCard,
  });

  if (onboardError) {
    return {
      ok: false,
      error: onboardError.message,
      rlsBlocked: isRlsPolicyError(onboardError.message),
    };
  }

  const sortedDomains = (Object.entries(xpDomainWeights) as [LifeDomainId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const primaryDomain = sortedDomains[0] ?? "learning";

  const targets = profileCard.firstTargets.slice(0, 3);
  if (isAssessment) {
    const { data: activeGoals, error: goalsError } = await supabase
      .from("goals")
      .select("id")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (goalsError) {
      return { ok: false, error: goalsError.message, rlsBlocked: isRlsPolicyError(goalsError.message) };
    }

    const goalIds = (activeGoals ?? []).map((goal) => goal.id as string);
    for (let i = 0; i < targets.length; i += 1) {
      const title = targets[i];
      const goalId = goalIds[i];
      if (goalId) {
        const { error: updateError } = await supabase
          .from("goals")
          .update({
            title,
            domain: primaryDomain,
            subarea: null,
            xp_value: 25,
            status: "active",
          })
          .eq("id", goalId);
        if (updateError) {
          return { ok: false, error: updateError.message, rlsBlocked: isRlsPolicyError(updateError.message) };
        }
      } else {
        const { error: goalError } = await supabase.from("goals").insert({
          profile_id: profileId,
          title,
          domain: primaryDomain,
          subarea: null,
          xp_value: 25,
          status: "active",
        });
        if (goalError) {
          return { ok: false, error: goalError.message, rlsBlocked: isRlsPolicyError(goalError.message) };
        }
      }
    }
  } else {
    for (const title of targets) {
      const { error: goalError } = await supabase.from("goals").insert({
        profile_id: profileId,
        title,
        domain: primaryDomain,
        subarea: null,
        xp_value: 25,
        status: "active",
      });
      if (goalError) {
        return { ok: false, error: goalError.message, rlsBlocked: isRlsPolicyError(goalError.message) };
      }
    }
  }

  if (!isAssessment) {
    const { data: community } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", "grove-welcome")
      .maybeSingle();

    if (community) {
      const { error: memError } = await supabase
        .from("memberships")
        .upsert(
          {
            community_id: community.id,
            profile_id: profileId,
            role: "member",
          },
          { onConflict: "community_id,profile_id" },
        );
      if (memError) {
        return { ok: false, error: memError.message, rlsBlocked: isRlsPolicyError(memError.message) };
      }
    }
  }

  return { ok: true, profileId };
}

export const ONBOARDING_SAVE_SETUP_HINT =
  "Could not save your profile. For local dev, add SUPABASE_SERVICE_ROLE_KEY to .env.local, or connect Clerk third-party auth in the Supabase dashboard.";
