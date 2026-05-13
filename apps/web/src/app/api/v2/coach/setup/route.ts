import { currentUser } from "@clerk/nextjs/server";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const lifeDomainIds = LIFE_DOMAINS.map((domain) => domain.id) as [LifeDomainId, ...LifeDomainId[]];
const frequencySchema = z.enum(["daily", "weekly", "once"]);
const domainSchema = z.enum(lifeDomainIds);

const taskSchema = z.object({
  title: z.string().min(1).max(140),
  frequency: frequencySchema,
  isRequired: z.boolean(),
  pointValue: z.number().int().min(1).max(200).optional(),
});

const goalSchema = z.object({
  title: z.string().min(1).max(120),
  domain: domainSchema,
  tasks: z.array(taskSchema).min(1).max(8),
});

const bodySchema = z.object({
  displayName: z.string().optional(),
  editingGoalId: z.string().uuid().nullable().optional(),
  goals: z.array(goalSchema).min(1).max(6),
});

function suggestPointValue(frequency: z.infer<typeof frequencySchema>, isRequired: boolean): number {
  if (frequency === "weekly") {
    return isRequired ? 22 : 18;
  }

  if (frequency === "once") {
    return isRequired ? 18 : 14;
  }

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

  const user = await currentUser().catch(() => null);
  const displayName =
    body.displayName?.trim() ||
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" },
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    return Response.json({ error: profileError?.message ?? "Could not create your profile." }, { status: 500 });
  }

  const profileId = profile.id as string;

  for (let index = 0; index < body.goals.length; index += 1) {
    const goal = body.goals[index];
    const replacingExisting = Boolean(body.editingGoalId && index === 0);
    let goalId = "";

    if (replacingExisting) {
      const { data: goalRow, error: goalError } = await supabase
        .from("goals")
        .update({
          title: goal.title,
          domain: goal.domain,
          subarea: null,
          xp_value: 25,
          status: "active",
        })
        .eq("id", body.editingGoalId!)
        .eq("profile_id", profileId)
        .select("id")
        .single();

      if (goalError || !goalRow) {
        return Response.json({ error: goalError?.message ?? `Could not update goal: ${goal.title}` }, { status: 500 });
      }

      goalId = goalRow.id as string;

      const { error: deleteTasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("goal_id", goalId)
        .eq("profile_id", profileId);

      if (deleteTasksError) {
        return Response.json({ error: deleteTasksError.message }, { status: 500 });
      }
    } else {
      const { data: goalRow, error: goalError } = await supabase
        .from("goals")
        .insert({
          profile_id: profileId,
          title: goal.title,
          domain: goal.domain,
          subarea: null,
          xp_value: 25,
          status: "active",
        })
        .select("id")
        .single();

      if (goalError || !goalRow) {
        return Response.json({ error: goalError?.message ?? `Could not create goal: ${goal.title}` }, { status: 500 });
      }

      goalId = goalRow.id as string;
    }

    const tasksPayload = goal.tasks.map((task) => ({
      profile_id: profileId,
      goal_id: goalId,
      title: task.title,
      domain: goal.domain,
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

  return Response.json({ ok: true, profileId });
}
