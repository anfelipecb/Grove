import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { display_name?: string };
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : null;

  if (!displayName || displayName.length < 1 || displayName.length > 80) {
    return NextResponse.json({ error: "Name must be 1–80 characters." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("clerk_user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
