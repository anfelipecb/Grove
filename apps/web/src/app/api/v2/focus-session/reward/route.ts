import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const XP_PER_SPRINT = 20;

type Body = {
  sprints?: number;
};

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const sprints = typeof body.sprints === "number" ? Math.floor(body.sprints) : 0;
  if (sprints < 1 || sprints > 20) {
    return NextResponse.json({ error: "Invalid sprint count." }, { status: 400 });
  }

  const xp = sprints * XP_PER_SPRINT;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, total_xp, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const reason = "focus session";
  const { error: xpError } = await supabase.from("xp_events").insert({
    profile_id: profile.id,
    reason,
    xp,
    spendable_points: xp,
    metadata: { sprints, kind: "focus_session" },
  });
  if (xpError) return NextResponse.json({ error: xpError.message }, { status: 500 });

  const totalXp = (profile.total_xp as number | undefined) ?? 0;
  const spendable = (profile.spendable_points as number | undefined) ?? 0;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      total_xp: totalXp + xp,
      spendable_points: spendable + xp,
    })
    .eq("id", profile.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ ok: true, xp, sprints });
}
