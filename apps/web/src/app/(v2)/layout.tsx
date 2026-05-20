import { V2Nav } from "@/components/v2/layout/v2-nav";
import { hasCommunityAccess } from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const userId = await getServerUserId();
  let communityLocked = false;

  if (userId) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("clerk_user_id", userId)
        .maybeSingle();
      const totalXp = (profile?.total_xp as number | undefined) ?? 0;
      communityLocked = !hasCommunityAccess(totalXp);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <V2Nav communityLocked={communityLocked} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
    </div>
  );
}
