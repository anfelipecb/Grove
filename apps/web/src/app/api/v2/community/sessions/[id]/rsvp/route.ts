import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json() as { rsvp: "yes" | "no" | "maybe" };
  const { rsvp } = body;

  if (!["yes", "no", "maybe"].includes(rsvp)) {
    return NextResponse.json({ error: "Invalid rsvp value" }, { status: 400 });
  }

  const { error } = await supabase
    .from("attendance")
    .upsert(
      { session_id: params.id, profile_id: profile.id, rsvp },
      { onConflict: "session_id,profile_id" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
