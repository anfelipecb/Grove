import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { z } from "zod";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";

const lifeDomainIds = LIFE_DOMAINS.map((d) => d.id) as [LifeDomainId, ...LifeDomainId[]];

const taskSchema = z.object({
  title: z.string().min(1).max(140),
  frequency: z.enum(["daily", "weekly", "once"]),
  isRequired: z.boolean(),
  pointValue: z.number().int().min(1).max(200).optional(),
});

const goalSchema = z.object({
  title: z.string().min(1).max(120),
  domain: z.enum(lifeDomainIds),
  tasks: z.array(taskSchema).min(1).max(8),
});

const bodySchema = z.object({
  goals: z.array(goalSchema).min(1).max(6),
});

function suggestPointValue(frequency: z.infer<typeof taskSchema>["frequency"], isRequired: boolean): number {
  if (frequency === "weekly") return isRequired ? 22 : 18;
  if (frequency === "once") return isRequired ? 18 : 14;
  return isRequired ? 12 : 10;
}

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const userSupabase = await createServerSupabaseClient();
  const supabase = userSupabase ?? createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return Response.json({ error: profileError?.message ?? "Profile not found." }, { status: 500 });
  }

  const profileId = profile.id as string;

  const { data: existingGoals, error: goalsError } = await supabase
    .from("goals")
    .select("id, title")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (goalsError) {
    return Response.json({ error: goalsError.message }, { status: 500 });
  }

  const pool = [...(existingGoals ?? [])];

  for (const payloadGoal of body.goals) {
    const normalized = payloadGoal.title.trim().toLowerCase();
    let match =
      pool.find((g) => (g.title as string).trim().toLowerCase() === normalized) ??
      pool.find((g) => (g.title as string).trim().toLowerCase().includes(normalized.slice(0, 12))) ??
      pool[0];

    if (!match) {
      const { data: inserted, error: insertGoalError } = await supabase
        .from("goals")
        .insert({
          profile_id: profileId,
          title: payloadGoal.title,
          domain: payloadGoal.domain,
          subarea: null,
          xp_value: 25,
          status: "active",
        })
        .select("id, title")
        .single();

      if (insertGoalError || !inserted) {
        return Response.json({ error: insertGoalError?.message ?? "Could not create goal." }, { status: 500 });
      }
      match = inserted;
    }

    const goalId = match.id as string;
    pool.splice(
      pool.findIndex((g) => g.id === goalId),
      1,
    );

    const { count, error: countError } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("goal_id", goalId)
      .eq("profile_id", profileId);

    if (countError) {
      return Response.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) > 0) {
      continue;
    }

    const tasksPayload = payloadGoal.tasks.map((task) => ({
      profile_id: profileId,
      goal_id: goalId,
      title: task.title,
      domain: payloadGoal.domain,
      is_required: task.isRequired,
      is_community_task: false,
      point_value: task.pointValue ?? suggestPointValue(task.frequency, task.isRequired),
      community_point_value: 0,
      frequency: task.frequency,
      status: "active",
    }));

    const { error: tasksError } = await supabase.from("tasks").insert(tasksPayload);
    if (tasksError) {
      return Response.json({ error: tasksError.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true });
}
