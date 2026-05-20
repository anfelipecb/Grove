import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { fetchCalendarEvents, getValidToken } from "@/lib/google-calendar";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { buildCoordinationSuggestions, nextDateStrings, normalizeEmail } from "@/lib/v2/community-coordination";
import type { ScheduleProfileInput } from "@/lib/free-windows";

type TokenShape = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
};

type Body = {
  inviteeEmail?: string;
  durationMinutes?: number;
};

async function loadEvents(token: TokenShape | null, dates: string[]) {
  if (!token || dates.length === 0) return [];
  try {
    const events = await fetchCalendarEvents(
      await getValidToken(token),
      `${dates[0]}T00:00:00.000Z`,
      `${dates[dates.length - 1]}T23:59:59.999Z`,
    );
    return events
      .filter((event) => event.start.dateTime && event.end.dateTime)
      .map((event) => ({
        title: event.summary ?? "Busy",
        start: event.start.dateTime!,
        end: event.end.dateTime!,
      }));
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = ((await req.json().catch(() => ({}))) as Body);
  const inviteeEmail = typeof body.inviteeEmail === "string" ? normalizeEmail(body.inviteeEmail) : "";
  const durationMinutes =
    typeof body.durationMinutes === "number" && body.durationMinutes >= 15 && body.durationMinutes <= 480
      ? Math.round(body.durationMinutes)
      : 60;

  if (!inviteeEmail) {
    return NextResponse.json({ error: "Invitee email is required." }, { status: 400 });
  }

  const userSupabase = await createServerSupabaseClient();
  const serviceSupabase = createServiceSupabaseClient();
  const supabase = userSupabase ?? serviceSupabase;
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("id, schedule_profile, google_calendar_token")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!senderProfile?.id) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const { data: recipientProfile } = serviceSupabase
    ? await serviceSupabase
        .from("profiles")
        .select("id, schedule_profile, google_calendar_token")
        .ilike("email", inviteeEmail)
        .maybeSingle()
    : { data: null };

  const dates = nextDateStrings(7);
  const [senderEvents, recipientEvents] = await Promise.all([
    loadEvents((senderProfile.google_calendar_token as TokenShape | null | undefined) ?? null, dates),
    loadEvents((recipientProfile?.google_calendar_token as TokenShape | null | undefined) ?? null, dates),
  ]);

  const suggestions = buildCoordinationSuggestions({
    dates,
    senderSchedule: (senderProfile.schedule_profile as ScheduleProfileInput | null | undefined) ?? undefined,
    senderEvents,
    recipientSchedule: (recipientProfile?.schedule_profile as ScheduleProfileInput | null | undefined) ?? undefined,
    recipientEvents,
    durationMinutes,
    limit: 3,
  });

  return NextResponse.json({
    suggestions,
    sharedAvailabilityFound: suggestions.some((slot) => slot.source === "shared"),
    recipientFound: Boolean(recipientProfile?.id),
  });
}
