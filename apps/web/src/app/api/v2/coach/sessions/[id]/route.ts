import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { upsertCoachMemoryChunk } from "@/lib/coach-memory";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const patchSchema = z.object({
  mood: z.string().max(64).optional().nullable(),
  summary: z.string().max(4000).optional().nullable(),
  transcript: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(30)
    .optional(),
  end: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await params;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.mood !== undefined) updates.mood = body.mood;
  if (body.summary !== undefined) updates.summary = body.summary;
  if (body.transcript !== undefined) updates.transcript = body.transcript;
  if (body.end) updates.ended_at = new Date().toISOString();

  const { data: session, error } = await supabase
    .from("coach_sessions")
    .update(updates)
    .eq("id", id)
    .eq("profile_id", profile.id)
    .select("id, summary, session_type")
    .maybeSingle();

  if (error || !session) {
    return NextResponse.json({ error: error?.message ?? "Session not found." }, { status: 404 });
  }

  if (body.end && session.summary && typeof session.summary === "string") {
    void upsertCoachMemoryChunk(supabase, {
      profileId: profile.id as string,
      sourceType: "session_summary",
      sourceId: session.id as string,
      content: session.summary,
      metadata: { session_type: session.session_type },
    });
  }

  return NextResponse.json({ ok: true });
}
