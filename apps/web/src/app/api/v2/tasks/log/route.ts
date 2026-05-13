import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LIFE_DOMAINS } from "@grove/core";

const VALID_DOMAINS = new Set<string>(LIFE_DOMAINS.map((d) => d.id));
const LOG_POINT_VALUE = 10;

type LogBody = { title?: string; domain?: string; notes?: string };

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as LogBody;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const domain = typeof body.domain === "string" ? body.domain : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!title) return Response.json({ error: "Title is required." }, { status: 400 });
  if (!VALID_DOMAINS.has(domain)) return Response.json({ error: "Invalid domain." }, { status: 400 });
  const validDomain = domain as (typeof LIFE_DOMAINS)[number]["id"];

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  // Create an ad-hoc task (once frequency) then immediately complete it
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({ profile_id: profile.id, title, domain: validDomain, frequency: "once", point_value: LOG_POINT_VALUE })
    .select("id")
    .single();

  if (taskError || !task) return Response.json({ error: taskError?.message ?? "Failed to create task." }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("task_completions").insert({
    task_id: task.id,
    profile_id: profile.id,
    completed_date: today,
    notes: notes || null,
    points_earned: LOG_POINT_VALUE,
  });

  await supabase
    .from("profiles")
    .update({ spendable_points: profile.spendable_points + LOG_POINT_VALUE })
    .eq("id", profile.id);

  return Response.json({ ok: true, task_id: task.id });
}
