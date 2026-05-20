import { NextResponse } from "next/server";
import { hasCommunityAccess } from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { normalizeEmail } from "@/lib/v2/community-coordination";

type Body = {
  communityId?: string;
  inviteeEmail?: string;
  activityTitle?: string;
  message?: string;
  goalContext?: string;
  proposedDate?: string;
  proposedStartTime?: string;
  durationMinutes?: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = ((await req.json().catch(() => ({}))) as Body);
  const communityId = typeof body.communityId === "string" ? body.communityId.trim() : "";
  const inviteeEmail = typeof body.inviteeEmail === "string" ? normalizeEmail(body.inviteeEmail) : "";
  const activityTitle = typeof body.activityTitle === "string" ? body.activityTitle.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : null;
  const goalContext = typeof body.goalContext === "string" ? body.goalContext.trim() : null;
  const proposedDate = typeof body.proposedDate === "string" ? body.proposedDate.trim() : "";
  const proposedStartTime = typeof body.proposedStartTime === "string" ? body.proposedStartTime.trim() : "";
  const durationMinutes =
    typeof body.durationMinutes === "number" && body.durationMinutes >= 15 && body.durationMinutes <= 480
      ? Math.round(body.durationMinutes)
      : 60;

  if (!UUID_RE.test(communityId)) {
    return NextResponse.json({ error: "Invalid community." }, { status: 400 });
  }
  if (!inviteeEmail || !inviteeEmail.includes("@")) {
    return NextResponse.json({ error: "Invitee email is required." }, { status: 400 });
  }
  if (!activityTitle) {
    return NextResponse.json({ error: "Activity title is required." }, { status: 400 });
  }
  if (!DATE_RE.test(proposedDate) || !TIME_RE.test(proposedStartTime)) {
    return NextResponse.json({ error: "Pick a proposed date and start time." }, { status: 400 });
  }

  const userSupabase = await createServerSupabaseClient();
  const serviceSupabase = createServiceSupabaseClient();
  const supabase = userSupabase ?? serviceSupabase;
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, total_xp")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile?.id) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  if (!hasCommunityAccess((profile.total_xp as number | undefined) ?? 0)) {
    return NextResponse.json({ error: "Community is still locked for this profile." }, { status: 403 });
  }
  if (profile.email && normalizeEmail(profile.email as string) === inviteeEmail) {
    return NextResponse.json({ error: "Invite someone else, not your own email." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("community_id")
    .eq("community_id", communityId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this community." }, { status: 403 });
  }

  const { data: recipientProfile } = serviceSupabase
    ? await serviceSupabase.from("profiles").select("id").ilike("email", inviteeEmail).maybeSingle()
    : { data: null };

  const { data: invite, error } = await supabase
    .from("community_invites")
    .insert({
      community_id: communityId,
      inviter_profile_id: profile.id,
      invitee_profile_id: recipientProfile?.id ?? null,
      invitee_email: inviteeEmail,
      activity_title: activityTitle,
      message,
      goal_context: goalContext,
      proposed_date: proposedDate,
      proposed_start_time: proposedStartTime,
      duration_minutes: durationMinutes,
    })
    .select("id, token, invitee_email, activity_title, proposed_date, proposed_start_time, duration_minutes, status")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: error?.message ?? "Could not send invite." }, { status: 500 });
  }

  return NextResponse.json({
    invite,
    inviteLink: `/community?invite=${invite.token}`,
    mailtoHref: `mailto:${invite.invitee_email}?subject=${encodeURIComponent(`Join me in Grove for ${invite.activity_title}`)}&body=${encodeURIComponent(
      `I invited you to coordinate in Grove.\n\nActivity: ${invite.activity_title}\nTime: ${invite.proposed_date} at ${invite.proposed_start_time}\n\nOpen Grove and check your Community tab after signing in.`,
    )}`,
  });
}
