import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const postSchema = z.object({
  session_type: z
    .enum(["debrief", "check_in", "stuck", "plan_day", "free_chat"])
    .default("free_chat"),
  mood: z.string().max(64).optional().nullable(),
});

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: session, error } = await supabase
    .from("coach_sessions")
    .insert({
      profile_id: profile.id,
      session_type: body.session_type,
      mood: body.mood ?? null,
    })
    .select("id, session_type, started_at")
    .single();

  if (error || !session) {
    return NextResponse.json({ error: error?.message ?? "Failed to start session." }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id, session_type: session.session_type });
}
