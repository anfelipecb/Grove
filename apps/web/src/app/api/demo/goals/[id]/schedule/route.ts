import { rejectUnlessTrustedDemoRoute } from "@/lib/demo-api-request";
import { getDemoProfileIdForApi } from "@/lib/demo-seed";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

type Body = {
  due_at?: string | null;
};

export async function PATCH(request: Request, context: { params: { id: string } }) {
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
  let dueAt: string | null = null;
  if (body.due_at === null || body.due_at === undefined || body.due_at === "") {
    dueAt = null;
  } else if (typeof body.due_at === "string") {
    const t = Date.parse(body.due_at);
    if (Number.isNaN(t)) {
      return Response.json({ error: "Invalid due_at" }, { status: 400 });
    }
    dueAt = new Date(t).toISOString();
  } else {
    return Response.json({ error: "Invalid due_at" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Service role not configured" }, { status: 500 });
  }

  const { data: goal, error: gErr } = await supabase
    .from("goals")
    .select("id, profile_id, status")
    .eq("id", goalId)
    .maybeSingle();

  if (gErr || !goal || goal.profile_id !== profileId || goal.status !== "active") {
    return Response.json({ error: "Goal not found or not editable" }, { status: 404 });
  }

  const { error: uErr } = await supabase.from("goals").update({ due_at: dueAt }).eq("id", goalId);

  if (uErr) {
    return Response.json({ error: uErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, due_at: dueAt });
}
