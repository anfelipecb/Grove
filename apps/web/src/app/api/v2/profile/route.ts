import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { ScheduleProfile } from "@/components/v2/profile/schedule-form";

export async function PATCH(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    display_name?: string;
    schedule_profile?: ScheduleProfile;
  };

  const displayName =
    typeof body.display_name === "string" ? body.display_name.trim() : null;
  const scheduleProfile =
    body.schedule_profile !== undefined ? body.schedule_profile : null;

  // Validate: at least one field must be present
  if (displayName === null && scheduleProfile === null) {
    return NextResponse.json(
      { error: "Provide display_name or schedule_profile." },
      { status: 400 }
    );
  }

  // Validate display_name if provided
  if (displayName !== null && (displayName.length < 1 || displayName.length > 80)) {
    return NextResponse.json(
      { error: "Name must be 1–80 characters." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const updates: Record<string, unknown> = {};
  if (displayName !== null) updates.display_name = displayName;
  if (scheduleProfile !== null) updates.schedule_profile = scheduleProfile;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("clerk_user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
