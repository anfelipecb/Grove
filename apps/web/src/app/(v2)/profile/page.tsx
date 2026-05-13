import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSeniorityProgress } from "@grove/core";
import { ProfileForm } from "@/components/v2/profile/profile-form";

export default async function ProfilePage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/sign-in");

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase!
    .from("profiles")
    .select("display_name, spendable_points")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  const { currentTier, nextTier, progressPercent } = getSeniorityProgress(profile.spendable_points);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Profile</h1>

      <ProfileForm initialName={profile.display_name ?? ""} />

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Progression
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-moss/15 px-2 py-0.5 text-xs font-semibold text-moss">
            {currentTier.label}
          </span>
          <span className="text-sm font-bold text-foreground">
            {profile.spendable_points.toLocaleString()} XP
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-moss transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {nextTier
            ? `${nextTier.label} at ${nextTier.minXp.toLocaleString()} XP`
            : "Max tier reached — Elder 🌳"}
        </p>
      </div>
    </div>
  );
}
