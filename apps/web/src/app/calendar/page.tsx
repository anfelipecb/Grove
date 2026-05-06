import { CalendarView, type CalendarEntry } from "@/components/calendar-view";
import { AppHeaderToolbar } from "@/components/app-header-toolbar";
import { getServerUserId, isClerkConfigured } from "@/lib/clerk-auth";
import { redirect } from "next/navigation";
import { createDemoAwareServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function communityNameFromJoin(raw: unknown): string | null {
  const c = Array.isArray(raw) ? raw[0] : raw;
  return (c as { name?: string } | null)?.name ?? null;
}

export default async function CalendarPage() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/sign-in?redirect_url=/calendar");
  }

  const { client: supabase, demo: demoReads } = await createDemoAwareServerClient();

  if (!demoReads && !isClerkConfigured()) {
    return (
      <main className="p-8 text-stone-700 dark:text-muted-foreground">
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to use the calendar.</p>
      </main>
    );
  }

  if (!supabase) {
    return (
      <main className="p-8 text-stone-700 dark:text-muted-foreground">
        <p>Supabase is not configured.</p>
        <p className="mt-2 text-sm">
          Demo mode needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or publishable key with a Clerk
          session).
        </p>
      </main>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, onboarding_step")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    return (
      <main className="p-8 text-bark dark:text-foreground">
        <p>Could not load profile: {error.message}</p>
      </main>
    );
  }

  if (!profile || profile.onboarding_step < 5) {
    redirect("/onboarding");
  }

  const profileId = profile.id as string;

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, due_at, community_id, communities(name)")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: memberships } = await supabase
    .from("memberships")
    .select("community_id")
    .eq("profile_id", profileId);

  const communityIds = [...new Set((memberships ?? []).map((m) => m.community_id as string))];

  let sessions: {
    id: string;
    title: string;
    starts_at: string | null;
    community_id: string;
    communities: unknown;
  }[] = [];

  if (communityIds.length > 0) {
    const { data: sess } = await supabase
      .from("sessions")
      .select("id, title, starts_at, community_id, communities(name)")
      .in("community_id", communityIds)
      .order("starts_at", { ascending: true, nullsFirst: false });
    sessions = (sess ?? []) as typeof sessions;
  }

  const entries: CalendarEntry[] = [];

  for (const g of goals ?? []) {
    const kind = g.community_id ? "community_goal" : "solo_goal";
    entries.push({
      id: g.id as string,
      kind,
      title: g.title as string,
      at: (g.due_at as string | null) ?? null,
      communityName: g.community_id ? communityNameFromJoin(g.communities) : null,
    });
  }

  for (const s of sessions) {
    entries.push({
      id: s.id,
      kind: "community_session",
      title: s.title,
      at: s.starts_at,
      communityName: communityNameFromJoin(s.communities),
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <AppHeaderToolbar demoMode={demoReads} />
        <div className="mt-6 space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Plan focus time for your goals alongside community sessions. This view is designed to grow — future
            external calendars can sync into the same timeline without changing how you work inside Grove.
          </p>
        </div>
        <div className="mt-8">
          <CalendarView initialEntries={entries} demoMode={demoReads} profileId={profileId} />
        </div>
      </div>
    </main>
  );
}
