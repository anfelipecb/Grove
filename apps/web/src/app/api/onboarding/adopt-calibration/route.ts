import { lifeDomainIdSchema } from "@grove/core";
import { z } from "zod";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const adoptBodySchema = z.object({
  confirmed: z.literal(true),
  rewards: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        cost: z.number().int().min(1),
        visibility: z.enum(["private", "community"]).optional(),
      }),
    )
    .max(10)
    .optional(),
  additionalGoals: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        domain: lifeDomainIdSchema,
      }),
    )
    .max(6)
    .optional(),
});

/** Explicit user-confirmed writes for calibration suggestions — never persists without confirmed: true. */
export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await request.json()) as unknown;
  const parsed = adoptBodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body. Client must send confirmed: true and valid payloads." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured or no JWT" }, { status: 500 });
  }

  const { data: profile, error: pErr } = await supabase.from("profiles").select("id").eq("clerk_user_id", userId).maybeSingle();

  if (pErr || !profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  const profileId = profile.id as string;

  const rewardsInserted: string[] = [];
  const goalsInserted: string[] = [];

  const goalsPayload = parsed.data.additionalGoals ?? [];
  for (const g of goalsPayload) {
    const { error } = await supabase.from("goals").insert({
      profile_id: profileId,
      title: g.title,
      domain: g.domain,
      subarea: null,
      xp_value: 25,
      status: "active",
    });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    goalsInserted.push(g.title);
  }

  const rewPayload = parsed.data.rewards ?? [];
  for (const r of rewPayload) {
    const vis = r.visibility ?? "private";
    const { error } = await supabase.from("rewards").insert({
      profile_id: profileId,
      title: r.title,
      cost: r.cost,
      visibility: vis,
    });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    rewardsInserted.push(r.title);
  }

  return Response.json({ ok: true, goalsInserted, rewardsInserted });
}
