import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isUniqueViolation, isValidCommunitySlug, normalizeSlugInput } from "@/app/api/communities/slug-utils";

type JoinBody = {
  slug?: string;
};

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = ((await request.json().catch(() => ({}))) as JoinBody);
  const slug = typeof body.slug === "string" ? normalizeSlugInput(body.slug) : "";

  if (!isValidCommunitySlug(slug)) {
    return NextResponse.json(
      {
        error:
          "Slug must be lowercase letters and numbers with hyphens (e.g. grove-welcome). Ask your organizer for the exact slug.",
      },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profileError || !profile?.id) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const profileId = profile.id as string;

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (communityError || !community?.id) {
    return NextResponse.json(
      {
        error:
          "No community matches that slug. Double-check spelling or ask your organizer for the invite slug.",
      },
      { status: 404 },
    );
  }

  const communityId = community.id as string;

  const { data: inserted, error: insertError } = await supabase
    .from("memberships")
    .insert({
      community_id: communityId,
      profile_id: profileId,
      role: "member",
    })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted?.id) {
    if (isUniqueViolation(insertError)) {
      return NextResponse.json(
        { error: "You are already a member of this community." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertError?.message ?? "Could not join community." }, { status: 500 });
  }

  return NextResponse.json({
    membershipId: inserted.id as string,
    community: {
      id: communityId,
      name: community.name,
      slug: community.slug,
    },
  });
}
