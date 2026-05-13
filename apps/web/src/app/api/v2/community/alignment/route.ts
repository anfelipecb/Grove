import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mergeNotes(existing: unknown): Record<string, unknown> {
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return { ...(existing as Record<string, unknown>) };
  }
  return {};
}

type Body = {
  communityId?: string;
  skip?: boolean;
  goalIds?: string[];
};

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = ((await req.json().catch(() => ({}))) as Body);
  const communityId = typeof body.communityId === "string" ? body.communityId.trim() : "";
  const skip = Boolean(body.skip);
  const goalIds = Array.isArray(body.goalIds)
    ? body.goalIds.filter((id): id is string => typeof id === "string" && UUID_RE.test(id))
    : [];

  if (!UUID_RE.test(communityId)) {
    return NextResponse.json({ error: "Invalid community." }, { status: 400 });
  }

  if (!skip && goalIds.length === 0) {
    return NextResponse.json({ error: "Select at least one shared goal or skip." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, private_focus_notes")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profileErr || !profile?.id) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const profileId = profile.id as string;

  const { data: membership, error: memErr } = await supabase
    .from("memberships")
    .select("community_id")
    .eq("profile_id", profileId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (memErr || !membership) {
    return NextResponse.json({ error: "You are not a member of this community." }, { status: 403 });
  }

  const mergedNotes = mergeNotes(profile.private_focus_notes);

  if (skip) {
    mergedNotes.community_alignment_status = "skipped";
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ private_focus_notes: mergedNotes })
      .eq("id", profileId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { data: goals, error: goalsErr } = await supabase
    .from("goals")
    .select("id, title, domain, community_id, is_public")
    .in("id", goalIds)
    .eq("community_id", communityId)
    .eq("is_public", true);

  if (goalsErr || !goals?.length || goals.length !== goalIds.length) {
    return NextResponse.json({ error: "One or more goals are invalid for this community." }, { status: 400 });
  }

  const inserts = goals.map((g) => ({
    profile_id: profileId,
    goal_id: g.id as string,
    community_id: communityId,
    title: `Contribute: ${g.title as string}`,
    domain: g.domain as string,
    is_required: false,
    is_community_task: true,
    frequency: "weekly" as const,
    preferred_time: "flexible" as const,
    point_value: 12,
    community_point_value: 15,
    status: "active" as const,
  }));

  const { error: taskErr } = await supabase.from("tasks").insert(inserts);

  if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 });

  mergedNotes.community_alignment_status = "completed";
  const { error: noteErr } = await supabase
    .from("profiles")
    .update({ private_focus_notes: mergedNotes })
    .eq("id", profileId);

  if (noteErr) return NextResponse.json({ error: noteErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, tasksCreated: inserts.length });
}
