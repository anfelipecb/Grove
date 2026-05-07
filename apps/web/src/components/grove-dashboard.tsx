"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Gift,
  Leaf,
  Library,
  MessageSquareText,
  Plus,
  Sprout,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import {
  DEFAULT_SUBAREAS,
  getClosestSurpriseUnlock,
  getSeniorityProgress,
  getSurpriseUnlocks,
  LIFE_DOMAINS,
  suggestXp,
  type LifeDomainId,
  type SurpriseUnlock,
  type XpInput,
} from "@grove/core";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { AppHeaderToolbar } from "@/components/app-header-toolbar";
import { DashboardInfoRow, DashboardPanel, dashboardInputClassName } from "@/components/dashboard/dashboard-ui";
import { formatDueLabel } from "@/components/dashboard/due-label";
import { CoachGreeting } from "@/components/dashboard/coach-greeting";
import { CoachSuggestions, type CoachSuggestionItem } from "@/components/dashboard/coach-suggestions";
import { computeXpConsistency } from "@/components/dashboard/xp-consistency";

export type DashboardGoalRow = {
  id: string;
  title: string;
  domain: string;
  subarea: string | null;
  xp_value: number;
  status: string;
  due_at: string | null;
};

export type DashboardXpEventRow = {
  id: string;
  reason: string;
  xp: number;
  created_at: string;
};

export type DashboardRewardRow = {
  id: string;
  title: string;
  cost: number;
  visibility: string;
  created_at: string;
};

export type GroveDashboardProps = {
  demoMode?: boolean;
  profileId: string;
  displayName: string;
  totalXp: number;
  spendablePoints: number;
  focusNotes: Record<string, unknown>;
  initialGoals: DashboardGoalRow[];
  initialXpEvents: DashboardXpEventRow[];
  communityLabels: string[];
  completedGoalsCount: number;
  joinedCommunitiesCount: number;
  activeCommitmentsCount: number;
  completedCommitmentsCount: number;
  initialRewards: DashboardRewardRow[];
  rewardCount: number;
};

const iconClass = "h-4 w-4";

function parseDueAt(dueLocal: string): string | null {
  if (dueLocal.trim() === "") return null;
  const t = new Date(dueLocal);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function GroveDashboard({
  demoMode = false,
  profileId,
  displayName,
  totalXp: initialTotalXp,
  spendablePoints: initialSpendable,
  focusNotes,
  initialGoals,
  initialXpEvents,
  communityLabels,
  completedGoalsCount,
  joinedCommunitiesCount,
  activeCommitmentsCount,
  completedCommitmentsCount,
  initialRewards,
  rewardCount,
}: GroveDashboardProps) {
  const auth = useAuth();
  const supabase = useMemo(
    () => (demoMode ? null : createBrowserSupabaseClient(() => auth.getToken?.() ?? Promise.resolve(null))),
    [demoMode, auth],
  );

  const [goals, setGoals] = useState(initialGoals);
  const [xpEvents, setXpEvents] = useState(initialXpEvents);
  const [totalXp, setTotalXp] = useState(initialTotalXp);
  const [spendablePoints, setSpendablePoints] = useState(initialSpendable);
  const [completedGoalCount, setCompletedGoalCount] = useState(completedGoalsCount);
  const [title, setTitle] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [domain, setDomain] = useState<LifeDomainId>("learning");
  const [subarea, setSubarea] = useState(DEFAULT_SUBAREAS.learning[0]);
  const [resistance, setResistance] = useState<XpInput["resistance"]>("medium");
  const [communityContribution, setCommunityContribution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [coachGreeting, setCoachGreeting] = useState<string | null>(null);
  const [coachInsight, setCoachInsight] = useState<string | null>(null);
  const [coachGreetingLoading, setCoachGreetingLoading] = useState(true);
  const [coachSuggestions, setCoachSuggestions] = useState<CoachSuggestionItem[]>([]);
  const [coachSuggestionsLoading, setCoachSuggestionsLoading] = useState(true);
  const addTargetDetailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let cancelled = false;
    const body = JSON.stringify({ profileId, demoMode });

    async function loadGreeting() {
      setCoachGreetingLoading(true);
      try {
        const res = await fetch("/api/ai/coach-greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = (await res.json()) as { greeting?: string; insight?: string };
        if (!cancelled && res.ok && typeof data.greeting === "string") {
          setCoachGreeting(data.greeting);
          setCoachInsight(typeof data.insight === "string" ? data.insight : null);
        } else if (!cancelled) {
          setCoachGreeting(null);
          setCoachInsight(null);
        }
      } catch {
        if (!cancelled) {
          setCoachGreeting(null);
          setCoachInsight(null);
        }
      } finally {
        if (!cancelled) {
          setCoachGreetingLoading(false);
        }
      }
    }

    async function loadSuggestions() {
      setCoachSuggestionsLoading(true);
      try {
        const res = await fetch("/api/ai/coach-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = (await res.json()) as { suggestions?: CoachSuggestionItem[] };
        if (!cancelled && res.ok && Array.isArray(data.suggestions)) {
          setCoachSuggestions(data.suggestions);
        } else if (!cancelled) {
          setCoachSuggestions([]);
        }
      } catch {
        if (!cancelled) {
          setCoachSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setCoachSuggestionsLoading(false);
        }
      }
    }

    loadGreeting();
    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [profileId, demoMode]);

  const adoptSuggestion = useCallback((item: CoachSuggestionItem) => {
    const nextDomain = item.domain as LifeDomainId;
    setTitle(item.title);
    setDomain(nextDomain);
    setSubarea(DEFAULT_SUBAREAS[nextDomain][0]);
    const el = addTargetDetailsRef.current;
    if (el) {
      el.open = true;
    }
    requestAnimationFrame(() => {
      document.getElementById("dashboard-add-target")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const summaryBlurb = useMemo(() => {
    const style = focusNotes?.support_style as string | undefined;
    const disclosure = focusNotes?.focus_disclosure as string | undefined;
    if (disclosure && String(disclosure).trim()) {
      return `${displayName}, your private focus notes are on file. Grove will use them only for coaching and nudges—not for public labels.`;
    }
    return `${displayName}, keep the next step small and visible. Mycelium will anchor plans to what you already said matters.${
      style ? ` Preferred support: ${style}.` : ""
    }`;
  }, [displayName, focusNotes]);

  const consistency = useMemo(() => computeXpConsistency(xpEvents), [xpEvents]);
  const nextGoal = goals[0] ?? null;

  const completedLocalXp = 0;
  const seniorityTotal = totalXp + completedLocalXp;
  const seniorityProgress = useMemo(() => getSeniorityProgress(seniorityTotal), [seniorityTotal]);
  const seniority = seniorityProgress.currentTier;
  const nextTier = seniorityProgress.nextTier;
  const tierProgress = seniorityProgress.progressPercent;
  const surpriseUnlocks = useMemo(
    () =>
      getSurpriseUnlocks({
        totalXp: seniorityTotal,
        streakDays: consistency.streakDays,
        activeDaysLast7: consistency.activeDaysLast7,
        completedGoals: completedGoalCount,
        joinedCommunities: joinedCommunitiesCount,
        activeCommitments: activeCommitmentsCount,
        completedCommitments: completedCommitmentsCount,
        savedRewards: rewardCount,
      }),
    [
      activeCommitmentsCount,
      completedCommitmentsCount,
      completedGoalCount,
      consistency.activeDaysLast7,
      consistency.streakDays,
      joinedCommunitiesCount,
      rewardCount,
      seniorityTotal,
    ],
  );
  const unlockedSurprises = surpriseUnlocks.filter((unlock) => unlock.unlocked);
  const nextUnlock = useMemo(
    () =>
      getClosestSurpriseUnlock({
        totalXp: seniorityTotal,
        streakDays: consistency.streakDays,
        activeDaysLast7: consistency.activeDaysLast7,
        completedGoals: completedGoalCount,
        joinedCommunities: joinedCommunitiesCount,
        activeCommitments: activeCommitmentsCount,
        completedCommitments: completedCommitmentsCount,
        savedRewards: rewardCount,
      }),
    [
      activeCommitmentsCount,
      completedCommitmentsCount,
      completedGoalCount,
      consistency.activeDaysLast7,
      consistency.streakDays,
      joinedCommunitiesCount,
      rewardCount,
      seniorityTotal,
    ],
  );

  const suggested = useMemo(
    () =>
      suggestXp({
        effort: "medium",
        resistance,
        value: communityContribution ? "critical" : "important",
        communityContribution,
      }),
    [communityContribution, resistance],
  );

  const addDisabled = !demoMode && !supabase;

  const addGoal = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setError(null);
    const xp = suggested.xp;
    const dueAt = parseDueAt(dueLocal);

    if (demoMode) {
      const res = await fetch("/api/demo/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          domain,
          subarea,
          xp_value: xp,
          due_at: dueAt,
        }),
      });
      const payload = (await res.json()) as { error?: string; goal?: DashboardGoalRow };
      if (!res.ok) {
        setError(payload.error ?? "Could not add goal.");
        return;
      }
      if (payload.goal) {
        setGoals((g) => [payload.goal as DashboardGoalRow, ...g]);
        setTitle("");
        setDueLocal("");
      }
      return;
    }

    if (!supabase) return;
    const { data, error: insertError } = await supabase
      .from("goals")
      .insert({
        profile_id: profileId,
        title: trimmed,
        domain,
        subarea,
        xp_value: xp,
        status: "active",
        due_at: dueAt,
      })
      .select("id, title, domain, subarea, xp_value, status, due_at")
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setGoals((g) => [data as DashboardGoalRow, ...g]);
      setTitle("");
      setDueLocal("");
    }
  }, [title, dueLocal, supabase, profileId, domain, subarea, suggested.xp, demoMode]);

  const completeGoal = useCallback(
    async (goal: DashboardGoalRow) => {
      if (goal.status !== "active") return;
      setError(null);
      const xpGain = goal.xp_value || suggested.xp;

      if (demoMode) {
        const res = await fetch(`/api/demo/goals/${goal.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xp: xpGain }),
        });
        const payload = (await res.json()) as {
          error?: string;
          xpEvent?: DashboardXpEventRow;
          profile?: { totalXp: number; spendablePoints: number };
        };
        if (!res.ok) {
          setError(payload.error ?? "Could not complete goal.");
          return;
        }
        if (payload.profile) {
          setTotalXp(payload.profile.totalXp);
          setSpendablePoints(payload.profile.spendablePoints);
        }
        if (payload.xpEvent) {
          setXpEvents((ev) => [payload.xpEvent as DashboardXpEventRow, ...ev]);
        }
        setCompletedGoalCount((count) => count + 1);
        setGoals((g) => g.filter((item) => item.id !== goal.id));
        return;
      }

      if (!supabase) return;
      const { error: u1 } = await supabase
        .from("goals")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", goal.id);
      if (u1) {
        setError(u1.message);
        return;
      }
      const { error: u2 } = await supabase.from("xp_events").insert({
        profile_id: profileId,
        goal_id: goal.id,
        reason: `Completed: ${goal.title}`,
        xp: xpGain,
        spendable_points: xpGain,
      });
      if (u2) {
        setError(u2.message);
        return;
      }
      const { error: u3 } = await supabase
        .from("profiles")
        .update({
          total_xp: totalXp + xpGain,
          spendable_points: spendablePoints + xpGain,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
      if (u3) {
        setError(u3.message);
        return;
      }
      setTotalXp((x) => x + xpGain);
      setSpendablePoints((x) => x + xpGain);
      setCompletedGoalCount((count) => count + 1);
      setGoals((g) => g.filter((item) => item.id !== goal.id));
      setXpEvents((ev) => [
        {
          id: crypto.randomUUID(),
          reason: `Completed: ${goal.title}`,
          xp: xpGain,
          created_at: new Date().toISOString(),
        },
        ...ev,
      ]);
    },
    [supabase, profileId, suggested.xp, totalXp, spendablePoints, demoMode],
  );

  const addForm = (
    <div className="grid gap-3">
      <input
        className={dashboardInputClassName}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Concrete next action"
      />
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Planned time (optional)
        <input
          type="datetime-local"
          className={dashboardInputClassName}
          value={dueLocal}
          onChange={(event) => setDueLocal(event.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className={dashboardInputClassName}
          value={domain}
          onChange={(event) => {
            const nextDomain = event.target.value as LifeDomainId;
            setDomain(nextDomain);
            setSubarea(DEFAULT_SUBAREAS[nextDomain][0]);
          }}
        >
          {LIFE_DOMAINS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className={dashboardInputClassName}
          value={subarea}
          onChange={(event) => setSubarea(event.target.value)}
        >
          {DEFAULT_SUBAREAS[domain].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          className={dashboardInputClassName}
          value={resistance}
          onChange={(event) => setResistance(event.target.value as XpInput["resistance"])}
        >
          <option value="low">Low resistance</option>
          <option value="medium">Medium resistance</option>
          <option value="high">High resistance</option>
          <option value="avoidant">Avoidant</option>
        </select>
        <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={communityContribution}
            onChange={(event) => setCommunityContribution(event.target.checked)}
          />
          Community
        </label>
      </div>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-50"
        type="button"
        disabled={addDisabled}
        onClick={addGoal}
      >
        <Plus className={iconClass} aria-hidden="true" />
        Add {suggested.xp} XP target
      </button>
    </div>
  );

  const supportPanel = (
    <DashboardPanel title="Support" icon={<MessageSquareText className={iconClass} />}>
      <div className="space-y-4">
        <dl className="space-y-3">
          <DashboardInfoRow label="Account" value={displayName} />
          <DashboardInfoRow label="Private focus data" value="Only you + RLS" />
        </dl>
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowAssessment((value) => !value)}
            className="inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent sm:w-auto"
          >
            {showAssessment ? "Hide calibration" : "Calibrate onboarding"}
          </button>
          {showAssessment ? (
            <div className="mt-3 grid gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <p className="leading-6 text-muted-foreground">
                Reopen onboarding to adjust goals, friction, and support style. For a quick chat first, head to
                Communities and Mycelium.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/onboarding?mode=assess"
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-bark px-3 py-2 font-semibold text-white transition hover:bg-moss min-[380px]:flex-none"
                >
                  Reopen onboarding
                </Link>
                <Link
                  href="/communities"
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-border bg-card px-3 py-2 font-semibold text-foreground transition hover:bg-accent min-[380px]:flex-none"
                >
                  Mycelium in Communities
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="space-y-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-bark text-white shadow-panel dark:shadow-panel-dark">
              <Leaf className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">Grove</h1>
              <p className="text-sm text-muted-foreground">Your personal loop—goals, consistency, XP.</p>
            </div>
          </div>
          <AppHeaderToolbar demoMode={demoMode} />
        </header>

        {error ? (
          <p className="mt-4 rounded-md border border-clay bg-clay/10 px-3 py-2 text-sm text-bark" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm dark:shadow-panel-dark sm:p-5">
              <p className="text-sm text-muted-foreground">
                Hi, <span className="font-medium text-foreground">{displayName}</span>
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
                <div>
                  <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Sprout className="h-3.5 w-3.5 text-moss" aria-hidden />
                    Total XP
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{seniorityTotal}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Bell className="h-3.5 w-3.5 text-moss" aria-hidden />
                    Points
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-moss">{spendablePoints}</p>
                </div>
                <div className="min-w-[min(100%,12rem)] flex-1">
                  <p className="text-xs text-muted-foreground">{seniority.label}</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-moss" style={{ width: `${tierProgress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextTier ? `${nextTier.label} at ${nextTier.minXp} XP` : "Top tier"}
                  </p>
                </div>
              </div>
              <CoachGreeting
                fallbackBlurb={summaryBlurb}
                greeting={coachGreeting}
                insight={coachInsight}
                loading={coachGreetingLoading}
              />
            </section>

            <DashboardPanel title="Consistency" icon={<Flame className={iconClass} />}>
              <p className="text-sm leading-relaxed text-muted-foreground">{consistency.message}</p>
            </DashboardPanel>

            <DashboardPanel title="Progression" icon={<Trophy className={iconClass} />}>
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current seniority</p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{seniority.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {nextTier
                        ? `${seniorityProgress.xpToNext} XP to ${nextTier.label}`
                        : "Top seniority tier reached"}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-moss" style={{ width: `${tierProgress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {nextTier
                      ? `${seniorityProgress.xpIntoTier} XP earned in this tier`
                      : "Keep stacking effort, contribution, and follow-through."}
                  </p>
                </div>

                <div className="rounded-xl border border-moss/20 bg-moss/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closest unlock</p>
                  {nextUnlock ? (
                    <>
                      <p className="mt-3 text-lg font-semibold text-foreground">{nextUnlock.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{nextUnlock.description}</p>
                      <p className="mt-3 text-sm font-medium text-foreground">
                        Surprise: {nextUnlock.rewardTitle} · {nextUnlock.rewardCost} points
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/70">
                        <div className="h-full bg-bark dark:bg-moss" style={{ width: `${nextUnlock.progressPercent}%` }} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{nextUnlock.progressLabel}</span>
                        <span>{nextUnlock.remainingLabel}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      You&apos;ve cleared every current surprise track. Add new goals or community commitments to keep
                      broadening the system.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ProgressStatCard
                  icon={<Target className={iconClass} aria-hidden />}
                  label="Completed goals"
                  value={String(completedGoalCount)}
                  detail="Visible proof that progress happened."
                />
                <ProgressStatCard
                  icon={<Flame className={iconClass} aria-hidden />}
                  label="Active days"
                  value={String(consistency.activeDaysLast7)}
                  detail="Days with XP in the last week."
                />
                <ProgressStatCard
                  icon={<Users className={iconClass} aria-hidden />}
                  label="Communities"
                  value={String(joinedCommunitiesCount)}
                  detail={joinedCommunitiesCount > 0 ? communityLabels.join(", ") : "Join one when you want more accountability."}
                />
                <ProgressStatCard
                  icon={<CheckCircle2 className={iconClass} aria-hidden />}
                  label="Community follow-through"
                  value={String(completedCommitmentsCount)}
                  detail={`${pluralize(activeCommitmentsCount, "active commitment")} in flight`}
                />
              </div>
            </DashboardPanel>

            <CoachSuggestions
              suggestions={coachSuggestions}
              loading={coachSuggestionsLoading}
              onAdopt={adoptSuggestion}
            />

            <DashboardPanel title="Unlocked surprises" icon={<Sparkles className={iconClass} />}>
              <div className="space-y-3">
                {unlockedSurprises.length === 0 ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Nothing unlocked yet. The first surprise opens at 250 XP or with a few days of consistency, so keep
                    the loop light and visible.
                  </p>
                ) : (
                  unlockedSurprises.map((unlock) => (
                    <SurpriseUnlockCard
                      key={unlock.id}
                      unlock={unlock}
                      spendablePoints={spendablePoints}
                    />
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved rewards</p>
                  <span className="text-xs text-muted-foreground">{pluralize(rewardCount, "reward")}</span>
                </div>
                {initialRewards.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No custom rewards saved yet. Mycelium calibration can seed a few, and this panel will track them
                    alongside unlocked surprises.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {initialRewards.map((reward) => (
                      <li
                        key={reward.id}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{reward.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {reward.cost} points · added {new Date(reward.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {reward.visibility}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DashboardPanel>

            <div className="rounded-xl border border-dashed border-border bg-muted/25 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action</p>
              {nextGoal ? (
                <>
                  <p className="mt-2 text-base font-semibold leading-snug">{nextGoal.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground capitalize">{nextGoal.subarea ?? nextGoal.domain}</p>
                  {formatDueLabel(nextGoal.due_at) ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Due {formatDueLabel(nextGoal.due_at)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a target to lock in your next win—keep it small and visible.
                </p>
              )}
            </div>

            <DashboardPanel title="Active goals" icon={<CheckCircle2 className={iconClass} />}>
              <div className="space-y-3">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active targets yet. Add one when you&apos;re ready.</p>
                ) : null}
                {goals.map((goal) => {
                  const dueStr = formatDueLabel(goal.due_at);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => completeGoal(goal)}
                      className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-moss/50 hover:bg-accent/30"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{goal.title}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="capitalize">{goal.subarea ?? goal.domain}</span>
                          {dueStr ? (
                            <span className="inline-flex items-center gap-0.5">
                              <CalendarCheck className="h-3 w-3" aria-hidden />
                              {dueStr}
                            </span>
                          ) : null}
                          <span className="text-muted-foreground/80">· tap to complete</span>
                        </span>
                      </span>
                      <span className="rounded-md bg-marigold/20 px-2 py-1 text-xs font-semibold text-bark dark:text-foreground">
                        {goal.xp_value} XP
                      </span>
                    </button>
                  );
                })}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Recent XP" icon={<Library className={iconClass} />}>
              {xpEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete a target to log XP here.</p>
              ) : (
                <ul className="space-y-2">
                  {xpEvents.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm font-medium leading-snug">{item.reason}</span>
                      <span className="flex shrink-0 items-center justify-between gap-2 text-xs sm:justify-end">
                        <span className="font-semibold text-clay">+{item.xp} XP</span>
                        <span className="text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <Link href="/communities" className="font-medium text-foreground underline-offset-4 hover:underline">
                Communities
              </Link>
              <span aria-hidden>·</span>
              <span>{communityLabels.length ? `${communityLabels.length} joined` : "Join a space when ready"}</span>
              <span aria-hidden>·</span>
              <span>Rewards — spend points soon</span>
            </div>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-4">
            <details
              ref={addTargetDetailsRef}
              id="dashboard-add-target"
              className="group rounded-xl border border-border bg-card/90 shadow-panel dark:shadow-panel-dark open:shadow-md"
              open={initialGoals.length === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <Plus className={iconClass} aria-hidden />
                  Add target
                </span>
                <span className="text-xs font-normal text-muted-foreground group-open:hidden">Tap to expand</span>
              </summary>
              <div className="border-t border-border p-4 pt-0">{addForm}</div>
            </details>
            {supportPanel}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProgressStatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-moss">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function SurpriseUnlockCard({
  unlock,
  spendablePoints,
}: {
  unlock: SurpriseUnlock;
  spendablePoints: number;
}) {
  const affordable = spendablePoints >= unlock.rewardCost;

  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold text-foreground">{unlock.label}</p>
        <span className="rounded-full bg-moss/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-bark dark:text-foreground">
          Unlocked
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{unlock.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Gift className="h-3.5 w-3.5 text-moss" aria-hidden />
          {unlock.rewardTitle}
        </span>
        <span className="text-muted-foreground">· {unlock.rewardCost} points</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {affordable ? "You can afford this now." : `${unlock.rewardCost - spendablePoints} more points if you want to cash it in.`}
      </p>
    </div>
  );
}
