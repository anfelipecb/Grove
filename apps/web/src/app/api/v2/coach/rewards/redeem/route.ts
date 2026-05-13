import {
  LIFE_DOMAINS,
  domainLevelFromPoints,
  type LifeDomainId,
} from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

function isLifeDomainId(value: string): value is LifeDomainId {
  return LIFE_DOMAINS.some((d) => d.id === value);
}

const bodySchema = z.object({
  reward_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid body." }, { status: 400 });
  }

  const profileId = profile.id as string;
  const spendable = (profile.spendable_points as number) ?? 0;

  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("id, profile_id, title, cost, domain, unlock_level")
    .eq("id", parsed.reward_id)
    .maybeSingle();

  if (rewardError || !reward || reward.profile_id !== profileId) {
    return Response.json({ error: "Reward not found." }, { status: 404 });
  }

  const cost = reward.cost as number;
  if (spendable < cost) {
    return Response.json({ error: "Not enough spendable points." }, { status: 400 });
  }

  const dom = reward.domain as string | null | undefined;
  const unlockLevel = (reward.unlock_level as number) ?? 1;

  if (dom && isLifeDomainId(dom)) {
    const { data: completionRows } = await supabase
      .from("task_completions")
      .select(
        `
        points_earned,
        tasks!inner(domain)
      `,
      )
      .eq("profile_id", profileId);

    let domainPoints = 0;
    for (const row of completionRows ?? []) {
      const join = row.tasks as { domain?: string | null } | null;
      if (join?.domain === dom) {
        domainPoints += (row.points_earned as number) ?? 0;
      }
    }

    const level = domainLevelFromPoints(domainPoints);
    if (level < unlockLevel) {
      return Response.json(
        { error: `Domain level too low (need ${unlockLevel}, have ${level}).` },
        { status: 400 },
      );
    }
  }

  const { error: insertError } = await supabase.from("reward_redemptions").insert({
    reward_id: reward.id as string,
    profile_id: profileId,
    cost,
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ spendable_points: spendable - cost })
    .eq("id", profileId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ ok: true, spent: cost, spendable_points: spendable - cost });
}
