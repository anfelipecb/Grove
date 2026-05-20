import { NextResponse } from "next/server";
import { hasCommunityAccess } from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { normalizeEmail } from "@/lib/v2/community-coordination";

type Body = {
  action?: "accept" | "decline" | "propose" | "confirm_proposal" | "cancel";
  counterDate?: string;
  counterStartTime?: string;
  responseNote?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function ensureMembership(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>> | NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  communityId: string,
  profileId: string,
) {
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("community_id", communityId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from("memberships").insert({
    community_id: communityId,
    profile_id: profileId,
    role: "member",
  });
}

async function createPlanForInvite(args: {
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>> | NonNullable<ReturnType<typeof createServiceSupabaseClient>>;
  invite: {
    id: string;
    community_id: string;
    inviter_profile_id: string;
    invitee_profile_id: string | null;
    activity_title: string;
    message: string | null;
    proposed_date: string | null;
    proposed_start_time: string | null;
    counter_date: string | null;
    counter_start_time: string | null;
    duration_minutes: number;
  };
  actorProfileId: string;
}) {
  const { supabase, invite, actorProfileId } = args;
  const { data: existing } = await supabase
    .from("community_plans")
    .select("id")
    .eq("invite_id", invite.id)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const scheduledDate = invite.counter_date ?? invite.proposed_date;
  const startTime = invite.counter_start_time ?? invite.proposed_start_time;
  if (!scheduledDate || !startTime || !invite.invitee_profile_id) return null;

  const { data: plan, error: planError } = await supabase
    .from("community_plans")
    .insert({
      community_id: invite.community_id,
      invite_id: invite.id,
      created_by: actorProfileId,
      title: invite.activity_title,
      description: invite.message,
      scheduled_date: scheduledDate,
      start_time: startTime,
      duration_minutes: invite.duration_minutes,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (planError || !plan?.id) {
    throw new Error(planError?.message ?? "Could not create plan.");
  }

  const { error: participantError } = await supabase
    .from("community_plan_participants")
    .upsert(
      [
        { plan_id: plan.id, profile_id: invite.inviter_profile_id, role: "organizer", response_status: "accepted" },
        { plan_id: plan.id, profile_id: invite.invitee_profile_id, role: "participant", response_status: "accepted" },
      ],
      { onConflict: "plan_id,profile_id", ignoreDuplicates: false },
    );

  if (participantError) throw new Error(participantError.message);
  return plan.id as string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = ((await req.json().catch(() => ({}))) as Body);
  const action = body.action;
  const counterDate = typeof body.counterDate === "string" ? body.counterDate.trim() : "";
  const counterStartTime = typeof body.counterStartTime === "string" ? body.counterStartTime.trim() : "";
  const responseNote = typeof body.responseNote === "string" ? body.responseNote.trim() : null;

  if (!action) return NextResponse.json({ error: "Action is required." }, { status: 400 });

  const userSupabase = await createServerSupabaseClient();
  const serviceSupabase = createServiceSupabaseClient();
  const reader = userSupabase ?? serviceSupabase;
  if (!reader) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data: profile } = await reader
    .from("profiles")
    .select("id, email, total_xp")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile?.id) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { id } = await params;
  const writer = userSupabase ?? serviceSupabase;
  if (!writer) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data: invite } = await writer
    .from("community_invites")
    .select("id, community_id, inviter_profile_id, invitee_profile_id, invitee_email, activity_title, message, proposed_date, proposed_start_time, duration_minutes, status, counter_date, counter_start_time")
    .eq("id", id)
    .maybeSingle();

  if (!invite?.id) return NextResponse.json({ error: "Invite not found." }, { status: 404 });

  const actorEmail = normalizeEmail((profile.email as string | null | undefined) ?? "");
  const isInviter = invite.inviter_profile_id === profile.id;
  const isInvitee =
    invite.invitee_profile_id === profile.id ||
    (actorEmail !== "" && normalizeEmail(invite.invitee_email as string) === actorEmail);

  if (!isInviter && !isInvitee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if ((action === "accept" || action === "propose" || action === "confirm_proposal") && !hasCommunityAccess((profile.total_xp as number | undefined) ?? 0)) {
    return NextResponse.json({ error: "Community is still locked for this profile." }, { status: 403 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (action === "decline") {
    if (!isInvitee) return NextResponse.json({ error: "Only the recipient can decline." }, { status: 403 });
    updates.status = "declined";
    updates.response_note = responseNote;
    updates.responded_at = new Date().toISOString();
  } else if (action === "cancel") {
    if (!isInviter) return NextResponse.json({ error: "Only the sender can cancel." }, { status: 403 });
    updates.status = "canceled";
    updates.response_note = responseNote;
    updates.responded_at = new Date().toISOString();
  } else if (action === "accept") {
    if (!isInvitee) return NextResponse.json({ error: "Only the recipient can accept." }, { status: 403 });
      await ensureMembership(writer, invite.community_id as string, profile.id as string);
    updates.invitee_profile_id = profile.id;
    updates.status = "accepted";
    updates.response_note = responseNote;
    updates.responded_at = new Date().toISOString();
  } else if (action === "propose") {
    if (!isInvitee) return NextResponse.json({ error: "Only the recipient can counter-propose." }, { status: 403 });
    if (!DATE_RE.test(counterDate) || !TIME_RE.test(counterStartTime)) {
      return NextResponse.json({ error: "Pick a new date and start time." }, { status: 400 });
    }
      await ensureMembership(writer, invite.community_id as string, profile.id as string);
    updates.invitee_profile_id = profile.id;
    updates.status = "proposed";
    updates.counter_date = counterDate;
    updates.counter_start_time = counterStartTime;
    updates.response_note = responseNote;
    updates.responded_at = new Date().toISOString();
  } else if (action === "confirm_proposal") {
    if (!isInviter) return NextResponse.json({ error: "Only the sender can confirm a counter-proposal." }, { status: 403 });
    if (invite.status !== "proposed") {
      return NextResponse.json({ error: "This invite has no counter-proposal to confirm." }, { status: 400 });
    }
    updates.status = "accepted";
    updates.response_note = responseNote;
    updates.responded_at = new Date().toISOString();
  } else {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const { data: updatedInvite, error } = await writer
    .from("community_invites")
    .update(updates)
    .eq("id", invite.id)
    .select("id, community_id, inviter_profile_id, invitee_profile_id, activity_title, message, proposed_date, proposed_start_time, duration_minutes, status, counter_date, counter_start_time")
    .single();

  if (error || !updatedInvite) {
    return NextResponse.json({ error: error?.message ?? "Could not update invite." }, { status: 500 });
  }

  let planId: string | null = null;
  if (updatedInvite.status === "accepted") {
      planId = await createPlanForInvite({
        supabase: writer,
        invite: {
        ...updatedInvite,
        invitee_profile_id: updatedInvite.invitee_profile_id as string | null,
        message: updatedInvite.message as string | null,
        proposed_date: updatedInvite.proposed_date as string | null,
        proposed_start_time: updatedInvite.proposed_start_time as string | null,
        counter_date: updatedInvite.counter_date as string | null,
        counter_start_time: updatedInvite.counter_start_time as string | null,
        duration_minutes: updatedInvite.duration_minutes as number,
      },
      actorProfileId: profile.id as string,
    });
  }

  return NextResponse.json({ ok: true, invite: updatedInvite, planId });
}
