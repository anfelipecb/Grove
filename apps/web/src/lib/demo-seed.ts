import {
  DEMO_CLERK_USER_ID,
  type DemoScenario,
  isLocalDemoEligible,
} from "@/lib/demo-mode";
import { demoGoalInsertsForProfile, demoProfile, demoProfileRowFields } from "@/lib/demo-data";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DemoSeedResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string };

function assertEligible(): SupabaseClient | null {
  if (!isLocalDemoEligible()) return null;
  return createServiceSupabaseClient();
}

/**
 * Idempotent seed for the fixed demo Clerk user. Requires service role + Supabase URL.
 */
export async function seedDemoScenario(scenario: DemoScenario): Promise<DemoSeedResult> {
  const supabase = assertEligible();
  if (!supabase) {
    return { ok: false, error: "Demo seed is only available in local development with demo mode enabled." };
  }

  const base = demoProfileRowFields(DEMO_CLERK_USER_ID);

  if (scenario === "onboarding") {
    const { data: profile, error: upErr } = await supabase
      .from("profiles")
      .upsert(
        {
          ...base,
          onboarding_step: 0,
          total_xp: 0,
          spendable_points: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clerk_user_id" },
      )
      .select("id")
      .single();

    if (upErr || !profile?.id) {
      return { ok: false, error: upErr?.message ?? "Profile upsert failed." };
    }

    const profileId = profile.id as string;
    await supabase.from("goals").delete().eq("profile_id", profileId);
    await supabase.from("xp_events").delete().eq("profile_id", profileId);
    return { ok: true, profileId };
  }

  const totalXp = demoProfile.totalXp;
  const spendable = totalXp;

  const { data: profile, error: upErr } = await supabase
    .from("profiles")
    .upsert(
      {
        ...base,
        onboarding_step: 5,
        total_xp: totalXp,
        spendable_points: spendable,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" },
    )
    .select("id")
    .single();

  if (upErr || !profile?.id) {
    return { ok: false, error: upErr?.message ?? "Profile upsert failed." };
  }

  const profileId = profile.id as string;

  await supabase.from("xp_events").delete().eq("profile_id", profileId);
  await supabase.from("goals").delete().eq("profile_id", profileId);

  const goalRows = demoGoalInsertsForProfile(profileId);
  const { error: gErr } = await supabase.from("goals").insert(goalRows);
  if (gErr) {
    return { ok: false, error: gErr.message };
  }

  const xpSample = [
    { reason: "Demo: weekly reflection", xp: 40, spendable_points: 40 },
    { reason: "Demo: showed up for build night", xp: 35, spendable_points: 35 },
  ];
  const { error: xErr } = await supabase.from("xp_events").insert(
    xpSample.map((row) => ({
      profile_id: profileId,
      goal_id: null,
      community_id: null,
      reason: row.reason,
      xp: row.xp,
      spendable_points: row.spendable_points,
      metadata: {},
    })),
  );
  if (xErr) {
    return { ok: false, error: xErr.message };
  }

  const { data: community } = await supabase.from("communities").select("id").eq("slug", "grove-welcome").maybeSingle();
  if (community?.id) {
    await supabase.from("memberships").upsert(
      {
        community_id: community.id,
        profile_id: profileId,
        role: "member",
      },
      { onConflict: "community_id,profile_id" },
    );
  }

  return { ok: true, profileId };
}

export async function getDemoProfileIdForApi(): Promise<string | null> {
  const supabase = assertEligible();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", DEMO_CLERK_USER_ID)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
