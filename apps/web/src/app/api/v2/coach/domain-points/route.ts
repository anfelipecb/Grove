import {
  LIFE_DOMAINS,
  POINTS_PER_DOMAIN_LEVEL,
  progressWithinCurrentDomainLevel,
  type LifeDomainId,
} from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function isLifeDomainId(value: string): value is LifeDomainId {
  return LIFE_DOMAINS.some((d) => d.id === value);
}

function emptyPointsMap(): Record<LifeDomainId, number> {
  return Object.fromEntries(LIFE_DOMAINS.map((d) => [d.id, 0])) as Record<LifeDomainId, number>;
}

export async function GET() {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  const profileId = profile.id as string;

  const { data: rows, error } = await supabase
    .from("task_completions")
    .select(
      `
      points_earned,
      tasks!inner(domain)
    `,
    )
    .eq("profile_id", profileId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const totals = emptyPointsMap();
  for (const row of rows ?? []) {
    const join = row.tasks as { domain?: string | null } | null;
    const raw = join?.domain ?? "";
    if (isLifeDomainId(raw)) {
      totals[raw] += (row.points_earned as number) ?? 0;
    }
  }

  const domains = LIFE_DOMAINS.map((d) => {
    const points = totals[d.id];
    const { level, pointsToNextLevel, fractionToNextLevel } = progressWithinCurrentDomainLevel(points);
    return {
      id: d.id,
      label: d.label,
      points,
      level,
      pointsToNextLevel,
      progressToNextLevel: fractionToNextLevel,
      pointsPerLevel: POINTS_PER_DOMAIN_LEVEL,
    };
  });

  return Response.json({ domains, pointsPerLevel: POINTS_PER_DOMAIN_LEVEL });
}
