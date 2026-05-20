import { DEMO_CLERK_USER_ID, type DemoScenario } from "@/lib/demo-mode";
import { demoGoalInsertsForProfile, demoProfile, demoProfileRowFields } from "@/lib/demo-data";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DemoSeedResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string };

function demoSeedBlocker(): string | null {
  if (process.env.NODE_ENV !== "development") {
    return "Demo seed only runs with NODE_ENV=development (use pnpm dev, not production build).";
  }
  if (process.env.NEXT_PUBLIC_DEMO_MODE?.trim() !== "true") {
    return "Set NEXT_PUBLIC_DEMO_MODE=true in .env.local and restart the dev server.";
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "Set NEXT_PUBLIC_SUPABASE_URL in .env.local.";
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase dashboard → Project Settings → API → service_role). Demo seed needs it to write the demo profile.";
  }
  return null;
}

function assertEligible(): SupabaseClient | null {
  if (demoSeedBlocker()) return null;
  return createServiceSupabaseClient();
}

/**
 * Idempotent seed for the fixed demo Clerk user. Requires service role + Supabase URL.
 */
export async function seedDemoScenario(scenario: DemoScenario): Promise<DemoSeedResult> {
  const blocker = demoSeedBlocker();
  if (blocker) {
    return { ok: false, error: blocker };
  }

  const supabase = assertEligible();
  if (!supabase) {
    return { ok: false, error: "Could not create Supabase service client. Check SUPABASE_SERVICE_ROLE_KEY." };
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
