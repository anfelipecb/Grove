import { rejectUnlessTrustedDemoRoute } from "@/lib/demo-api-request";
import { getDemoProfileIdForApi } from "@/lib/demo-seed";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

type XpEventPayload = {
  id: string;
  reason: string;
  xp: number;
  created_at: string;
};

type Body = {
  xp?: number;
};

export async function POST(request: Request, context: { params: { id: string } }) {
  const denied = rejectUnlessTrustedDemoRoute();
  if (denied) return denied;

  const goalId = context.params.id;
  if (!goalId) {
    return Response.json({ error: "Missing goal id" }, { status: 400 });
  }

  const profileId = await getDemoProfileIdForApi();
  if (!profileId) {
    return Response.json({ error: "Demo profile missing." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Service role not configured" }, { status: 500 });
  }

  const { data: goal, error: gErr } = await supabase
    .from("goals")
    .select("id, title, xp_value, status, profile_id")
    .eq("id", goalId)
    .maybeSingle();

  if (gErr || !goal || goal.profile_id !== profileId || goal.status !== "active") {
    return Response.json({ error: "Goal not found or not active" }, { status: 404 });
  }

  const xpGain = typeof body.xp === "number" && Number.isFinite(body.xp) ? body.xp : (goal.xp_value as number);

  const { error: u1 } = await supabase
    .from("goals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", goalId);

  if (u1) {
    return Response.json({ error: u1.message }, { status: 500 });
  }

  const { data: xpRow, error: u2 } = await supabase
    .from("xp_events")
    .insert({
      profile_id: profileId,
      goal_id: goalId,
      reason: `Completed: ${goal.title as string}`,
      xp: xpGain,
      spendable_points: xpGain,
      metadata: {},
    })
    .select("id, reason, xp, created_at")
    .single();

  if (u2 || !xpRow) {
    return Response.json({ error: u2?.message ?? "XP insert failed" }, { status: 500 });
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("total_xp, spendable_points")
    .eq("id", profileId)
    .single();

  const nextTotal = ((prof?.total_xp as number) ?? 0) + xpGain;
  const nextSpend = ((prof?.spendable_points as number) ?? 0) + xpGain;

  const { error: u3 } = await supabase
    .from("profiles")
    .update({
      total_xp: nextTotal,
      spendable_points: nextSpend,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (u3) {
    return Response.json({ error: u3.message }, { status: 500 });
  }

  const xpEvent: XpEventPayload = {
    id: xpRow.id as string,
    reason: xpRow.reason as string,
    xp: xpRow.xp as number,
    created_at: xpRow.created_at as string,
  };

  return Response.json({
    xpEvent,
    profile: { totalXp: nextTotal, spendablePoints: nextSpend },
  });
}
