import { getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";
import { redirect } from "next/navigation";
import { CommunitiesView } from "@/components/communities-view";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  if (!isClerkConfigured()) {
    return <main className="p-8 text-stone-700">Set Clerk environment variables to use Communities.</main>;
  }

  const userId = await getServerUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/communities");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return <main className="p-8 text-stone-700">Supabase is not configured.</main>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarding_step")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile || profile.onboarding_step < 5) {
    redirect("/onboarding");
  }

  const profileId = profile.id as string;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, community_id, communities(id, name, slug)")
    .eq("profile_id", profileId);

  const communities = (memberships ?? [])
    .map((row) => {
      const raw = row.communities as unknown;
      const c = Array.isArray(raw) ? raw[0] : raw;
      const com = c as { id: string; name: string; slug: string } | null | undefined;
      if (!com?.id) return null;
      return {
        membershipId: row.id as string,
        communityId: com.id,
        name: com.name,
        slug: com.slug,
      };
    })
    .filter(Boolean) as {
    membershipId: string;
    communityId: string;
    name: string;
    slug: string;
  }[];

  return <CommunitiesView communities={communities} />;
}
