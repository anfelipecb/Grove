import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { upsertCoachMemoryChunk } from "@/lib/coach-memory";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const date = new URL(req.url).searchParams.get("date")?.trim() ?? "";
  if (!isValidDateKey(date)) {
    return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id, content, entry_date, mood, created_at")
    .eq("profile_id", profile.id)
    .eq("entry_date", date)
    .maybeSingle();

  return NextResponse.json({ entry: entry ?? null });
}

type JournalBody = {
  content?: string;
  entry_date?: string;
  mood?: string | null;
};

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as JournalBody;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const entryDate = typeof body.entry_date === "string" ? body.entry_date.trim() : "";
  const mood = typeof body.mood === "string" ? body.mood.trim() || null : null;

  if (!content) return NextResponse.json({ error: "Content is required." }, { status: 400 });
  if (!isValidDateKey(entryDate)) {
    return NextResponse.json({ error: "Invalid entry_date. Use YYYY-MM-DD." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .upsert(
      {
        profile_id: profile.id,
        content,
        entry_date: entryDate,
        mood,
      },
      { onConflict: "profile_id,entry_date" },
    )
    .select("id, content, entry_date, mood, created_at")
    .single();

  if (error || !entry) {
    return NextResponse.json({ error: error?.message ?? "Failed to save entry." }, { status: 500 });
  }

  const journalXp = 8;
  const { data: profileXp } = await supabase
    .from("profiles")
    .select("total_xp, spendable_points")
    .eq("id", profile.id)
    .maybeSingle();

  const totalXp = (profileXp?.total_xp as number | undefined) ?? 0;
  const spendable = (profileXp?.spendable_points as number | undefined) ?? 0;

  await supabase.from("xp_events").insert({
    profile_id: profile.id,
    reason: "journal reflection",
    xp: journalXp,
    spendable_points: journalXp,
    metadata: { entry_date: entryDate, kind: "journal" },
  });

  await supabase
    .from("profiles")
    .update({
      total_xp: totalXp + journalXp,
      spendable_points: spendable + journalXp,
    })
    .eq("id", profile.id);

  void upsertCoachMemoryChunk(supabase, {
    profileId: profile.id as string,
    sourceType: "journal",
    sourceId: entry.id as string,
    content,
    metadata: { entry_date: entryDate, mood },
  });

  return NextResponse.json({ ok: true, entry, xp_awarded: journalXp });
}
