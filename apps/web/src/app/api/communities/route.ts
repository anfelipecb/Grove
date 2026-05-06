import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isUniqueViolation, isValidCommunitySlug, normalizeSlugInput } from "./slug-utils";

type CreateBody = {
  name?: string;
  slug?: string;
  description?: string | null;
};

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as CreateBody;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? normalizeSlugInput(body.slug) : "";
  const description =
    typeof body.description === "string" ? body.description.trim() || null : body.description === null ? null : null;

  if (!name || name.length > 200) {
    return Response.json({ error: "Name is required (max 200 characters)." }, { status: 400 });
  }
  if (!isValidCommunitySlug(slug)) {
    return Response.json(
      {
        error:
          "Slug must be lowercase letters and numbers, hyphen-separated (e.g. my-build-circle). It cannot be changed after creation.",
      },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profileError || !profile?.id) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }

  const profileId = profile.id as string;

  const { data: community, error: comError } = await supabase
    .from("communities")
    .insert({
      name,
      slug,
      description,
      created_by: profileId,
    })
    .select("id, name, slug, description")
    .single();

  if (comError || !community?.id) {
    if (isUniqueViolation(comError)) {
      return Response.json(
        { error: "That URL slug is already taken. Choose another slug." },
        { status: 409 },
      );
    }
    return Response.json({ error: comError?.message ?? "Could not create community." }, { status: 500 });
  }

  const communityId = community.id as string;

  const { error: memError } = await supabase.from("memberships").insert({
    community_id: communityId,
    profile_id: profileId,
    role: "owner",
  });

  if (memError) {
    await supabase.from("communities").delete().eq("id", communityId);
    return Response.json(
      { error: memError.message ?? "Membership create failed; creation was rolled back." },
      { status: 500 },
    );
  }

  return Response.json({
    community: {
      id: communityId,
      name: community.name,
      slug: community.slug,
      description: community.description,
    },
  });
}
