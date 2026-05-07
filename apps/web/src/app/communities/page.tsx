import { CommunitiesView } from "@/components/communities-view";
import { demoSessionActiveServer, getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";
import { redirect } from "next/navigation";
import { createDemoAwareServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const demo = demoSessionActiveServer();

  const userId = await getServerUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/communities");
  }

  const { client: supabase } = await createDemoAwareServerClient();

  if (!demo && !isClerkConfigured()) {
    return <main className="p-8 text-foreground">Set Clerk environment variables to use Communities.</main>;
  }

  if (!supabase) {
    return <main className="p-8 text-foreground">Supabase is not configured.</main>;
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
    .select("id, role, community_id, communities(id, name, slug, description)")
    .eq("profile_id", profileId);

  const communities = (memberships ?? [])
    .map((row) => {
      const raw = row.communities as unknown;
      const c = Array.isArray(raw) ? raw[0] : raw;
      const com = c as { id: string; name: string; slug: string; description: string | null } | null | undefined;
      if (!com?.id) return null;
      const role = row.role as "owner" | "organizer" | "member" | undefined;
      return {
        membershipId: row.id as string,
        communityId: com.id,
        name: com.name,
        slug: com.slug,
        description: com.description ?? null,
        role: role ?? "member",
      };
    })
    .filter(Boolean) as {
    membershipId: string;
    communityId: string;
    name: string;
    slug: string;
    description: string | null;
    role: "owner" | "organizer" | "member";
  }[];

  return <CommunitiesView communities={communities} demoMode={demo} profileId={profileId} />;
}
