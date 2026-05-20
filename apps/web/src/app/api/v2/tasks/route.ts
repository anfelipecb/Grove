import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LIFE_DOMAINS } from "@grove/core";

const VALID_DOMAINS = new Set<string>(LIFE_DOMAINS.map((d) => d.id));
const VALID_FREQUENCIES = new Set(["daily", "weekly", "once"]);
const VALID_PREFERRED_TIMES = new Set(["morning", "afternoon", "evening", "flexible"]);

const VALID_DIFFICULTIES = new Set(["low", "medium", "high"]);

type CreateTaskBody = {
  title?: string;
  domain?: string;
  frequency?: string;
  preferred_time?: string;
  point_value?: number;
  difficulty?: string;
};

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as CreateTaskBody;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const domain = typeof body.domain === "string" ? body.domain : "";
  const frequency = typeof body.frequency === "string" ? body.frequency : "daily";
  const preferred_time = typeof body.preferred_time === "string" ? body.preferred_time : "flexible";

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!VALID_DOMAINS.has(domain)) return NextResponse.json({ error: "Invalid domain." }, { status: 400 });
  if (!VALID_FREQUENCIES.has(frequency)) return NextResponse.json({ error: "Invalid frequency." }, { status: 400 });
  if (!VALID_PREFERRED_TIMES.has(preferred_time)) return NextResponse.json({ error: "Invalid preferred_time." }, { status: 400 });

  const difficulty =
    typeof body.difficulty === "string" && VALID_DIFFICULTIES.has(body.difficulty) ? body.difficulty : null;
  if (body.difficulty != null && body.difficulty !== "" && !difficulty) {
    return NextResponse.json({ error: "Invalid difficulty." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const pointValue = frequency === "daily" ? 10 : frequency === "weekly" ? 18 : 14;

  const insertRow: Record<string, unknown> = {
    profile_id: profile.id,
    title,
    domain,
    frequency,
    preferred_time,
    status: "active",
    point_value: body.point_value ?? pointValue,
  };
  if (difficulty) insertRow.difficulty = difficulty;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert(insertRow)
    .select("id, title, domain, is_required, is_community_task, point_value, community_point_value, preferred_time")
    .single();

  if (error || !task) return NextResponse.json({ error: error?.message ?? "Failed to create task." }, { status: 500 });

  return NextResponse.json({ ok: true, task });
}
