import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
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

  const { data: membership } = await supabase
    .from("memberships")
    .select("community_id, role")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership || (membership.role !== "owner" && membership.role !== "organizer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { title: string; description?: string; starts_at: string; ends_at?: string };
  const { title, description, starts_at, ends_at } = body;

  if (!title || !starts_at) {
    return NextResponse.json({ error: "title and starts_at are required" }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      community_id: membership.community_id,
      title,
      description: description ?? null,
      starts_at,
      ends_at: ends_at ?? null,
    })
    .select("id, title, starts_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ session }, { status: 201 });
}
