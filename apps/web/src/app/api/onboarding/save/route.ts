import { currentUser } from "@clerk/nextjs/server";
import type { IntakeDraft, MemberProfileCard } from "@grove/core";
import type { LifeDomainId } from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";

type SaveBody = {
  intake: IntakeDraft;
  profileCard: MemberProfileCard;
  xpDomainWeights: Record<LifeDomainId, number>;
  mode?: "initial" | "assessment";
};

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SaveBody;
  if (!body?.intake || !body?.profileCard || !body?.xpDomainWeights) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userSupabase = await createServerSupabaseClient();
  const supabase = userSupabase ?? createServiceSupabaseClient();
  if (!supabase) {
    return Response.json(
      {
        error:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or anon key) in Vercel.",
      },
      { status: 500 },
    );
  }

  const user = await currentUser();
  const displayName =
    body.intake.name?.trim() ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Member";
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        clerk_user_id: userId,
        display_name: displayName,
        email,
        onboarding_step: 5,
        xp_domain_weights: body.xpDomainWeights,
        private_focus_notes: {
          focus_disclosure: body.intake.focusDisclosure ?? "",
          support_style: body.intake.supportStyle,
        },
        public_support_preferences: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" },
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    return Response.json(
      { error: profileError?.message ?? "Profile upsert failed. Check Supabase + Clerk third-party auth." },
      { status: 500 },
    );
  }

  const profileId = profile.id;

  const { error: onboardError } = await supabase.from("onboarding_responses").insert({
    profile_id: profileId,
    responses: body.intake,
    profile_card: body.profileCard,
  });

  if (onboardError) {
    return Response.json({ error: onboardError.message }, { status: 500 });
  }

  const sortedDomains = (Object.entries(body.xpDomainWeights) as [LifeDomainId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const primaryDomain = sortedDomains[0] ?? "learning";

  if (body.mode !== "assessment") {
    const targets = body.profileCard.firstTargets.slice(0, 3);
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
        return Response.json({ error: goalError.message }, { status: 500 });
      }
    }
  }

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
      return Response.json({ error: memError.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true, profileId });
}
