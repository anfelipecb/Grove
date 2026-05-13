import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSeniorityProgress, getSurpriseUnlocks, type ProgressionSnapshot } from "@grove/core";
import { ProfileForm } from "@/components/v2/profile/profile-form";
import { ScheduleForm } from "@/components/v2/profile/schedule-form";
import { GoogleCalendarConnect } from "@/components/v2/profile/google-calendar-connect";
import type { ScheduleProfile } from "@/components/v2/profile/schedule-form";

const TIER_DESCRIPTIONS: Record<string, string> = {
  seed: "You're just getting started. Every task plants a root.",
  sprout: "You've built a habit. Keep the momentum going.",
  rooted: "Consistency is becoming your identity.",
  steward: "You're leading by example — inside and in community.",
  elder: "You've reached the top tier. A true Grove elder.",
};

export default async function ProfilePage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/sign-in");

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase!
    .from("profiles")
    .select("id, display_name, spendable_points, schedule_profile, google_calendar_token")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile) redirect("/sign-in");

  // Fetch streak and community membership for snapshot
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: recentCompletions }, { data: membership }, { data: rewards }] = await Promise.all([
    supabase!
      .from("task_completions")
      .select("completed_date")
      .eq("profile_id", profile.id)
      .gte("completed_date", thirtyDaysAgo)
      .order("completed_date", { ascending: false }),
    supabase!
      .from("memberships")
      .select("id")
      .eq("profile_id", profile.id)
      .limit(1),
    supabase!
      .from("rewards")
      .select("id")
      .eq("profile_id", profile.id)
      .limit(20),
  ]);

  // Compute streak
  const days = new Set((recentCompletions ?? []).map((r) => r.completed_date));
  let streak = 0;
  let cursor = new Date(today);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const snapshot: ProgressionSnapshot = {
    totalXp: profile.spendable_points,
    streakDays: streak,
    activeDaysLast7: Math.min(streak, 7),
    completedGoals: 0,
    joinedCommunities: (membership ?? []).length,
    activeCommitments: 0,
    completedCommitments: 0,
    savedRewards: (rewards ?? []).length,
  };

  const { currentTier, nextTier, progressPercent, xpToNext } = getSeniorityProgress(profile.spendable_points);
  const allSurprises = getSurpriseUnlocks(snapshot);
  const nextUnlocks = allSurprises.filter((s) => !s.unlocked).slice(0, 3);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Profile</h1>

      <ProfileForm initialName={profile.display_name ?? ""} />

      <ScheduleForm initialSchedule={(profile.schedule_profile as ScheduleProfile) ?? {}} />

      <GoogleCalendarConnect connected={!!profile.google_calendar_token} />

      {/* Progression */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Progress
        </p>

        {/* Current tier */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-moss/15 px-2.5 py-0.5 text-sm font-bold text-moss">
                {currentTier.label}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {profile.spendable_points.toLocaleString()} XP
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {TIER_DESCRIPTIONS[currentTier.id] ?? ""}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold">{streak}</span>
            </div>
          )}
        </div>

        {/* Progress bar to next tier */}
        {nextTier ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">→ {nextTier.label}</span>
              <span className="font-medium text-moss">{xpToNext.toLocaleString()} XP to go</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-moss transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {progressPercent}% of the way to {nextTier.label} ({nextTier.minXp.toLocaleString()} XP)
            </p>
          </div>
        ) : (
          <p className="text-sm text-moss font-medium">Max tier reached — Elder 🌳</p>
        )}

        {/* Next unlocks */}
        {nextUnlocks.length > 0 && (
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Next rewards to unlock
            </p>
            {nextUnlocks.map((unlock) => (
              <div key={unlock.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{unlock.label}</span>
                  <span className="text-[11px] text-muted-foreground">{unlock.progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-marigold transition-all"
                    style={{ width: `${unlock.progressPercent}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{unlock.remainingLabel}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
