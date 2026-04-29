"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { useMemo, useState, useCallback } from "react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  CircleGauge,
  Coins,
  Leaf,
  Library,
  MessageSquareText,
  Plus,
  Sprout,
  Users,
} from "lucide-react";
import {
  DEFAULT_SUBAREAS,
  getNextSeniorityTier,
  getSeniorityTier,
  LIFE_DOMAINS,
  suggestXp,
  type LifeDomainId,
  type XpInput,
} from "@grove/core";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { NavLinks } from "@/components/nav-links";

export type DashboardGoalRow = {
  id: string;
  title: string;
  domain: string;
  subarea: string | null;
  xp_value: number;
  status: string;
};

export type DashboardXpEventRow = {
  id: string;
  reason: string;
  xp: number;
  created_at: string;
};

export type GroveDashboardProps = {
  profileId: string;
  displayName: string;
  totalXp: number;
  spendablePoints: number;
  focusNotes: Record<string, unknown>;
  initialGoals: DashboardGoalRow[];
  initialXpEvents: DashboardXpEventRow[];
  communityLabels: string[];
};

const iconClass = "h-4 w-4";

const inputBase =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

export function GroveDashboard({
  profileId,
  displayName,
  totalXp: initialTotalXp,
  spendablePoints: initialSpendable,
  focusNotes,
  initialGoals,
  initialXpEvents,
  communityLabels,
}: GroveDashboardProps) {
  const { getToken } = useAuth();
  const supabase = useMemo(
    () => createBrowserSupabaseClient(() => getToken()),
    [getToken],
  );

  const [goals, setGoals] = useState(initialGoals);
  const [xpEvents, setXpEvents] = useState(initialXpEvents);
  const [totalXp, setTotalXp] = useState(initialTotalXp);
  const [spendablePoints, setSpendablePoints] = useState(initialSpendable);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<LifeDomainId>("learning");
  const [subarea, setSubarea] = useState(DEFAULT_SUBAREAS.learning[0]);
  const [resistance, setResistance] = useState<XpInput["resistance"]>("medium");
  const [communityContribution, setCommunityContribution] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const completedLocalXp = 0;
  const seniorityTotal = totalXp + completedLocalXp;
  const seniority = getSeniorityTier(seniorityTotal);
  const nextTier = getNextSeniorityTier(seniorityTotal);
  const tierProgress = nextTier
    ? Math.min(100, Math.round(((seniorityTotal - seniority.minXp) / (nextTier.minXp - seniority.minXp)) * 100))
    : 100;

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

  const addGoal = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || !supabase) return;
    setError(null);
    const xp = suggested.xp;
    const { data, error: insertError } = await supabase
      .from("goals")
      .insert({
        profile_id: profileId,
        title: trimmed,
        domain,
        subarea,
        xp_value: xp,
        status: "active",
      })
      .select("id, title, domain, subarea, xp_value, status")
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setGoals((g) => [data as DashboardGoalRow, ...g]);
      setTitle("");
    }
  }, [title, supabase, profileId, domain, subarea, suggested.xp]);

  const completeGoal = useCallback(
    async (goal: DashboardGoalRow) => {
      if (!supabase || goal.status !== "active") return;
      setError(null);
      const xpGain = goal.xp_value || suggested.xp;
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
    [supabase, profileId, suggested.xp, totalXp, spendablePoints],
  );

  const primaryCommunity = communityLabels[0] ?? "Your communities";

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-bark text-white shadow-panel">
              <Leaf className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Grove</h1>
              <p className="text-sm text-stone-600">Personal follow-through and community participation.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm sm:flex">
            <Metric icon={<Sprout className={iconClass} />} label={seniority.label} value={`${seniorityTotal} XP`} />
            <Metric icon={<Users className={iconClass} />} label="Community" value={primaryCommunity} />
            <Metric icon={<Bell className={iconClass} />} label="Points" value={`${spendablePoints} pts`} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavLinks />
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {error ? (
          <p className="rounded-md border border-clay bg-clay/10 px-3 py-2 text-sm text-bark" role="alert">
            {error}
          </p>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Today" icon={<CircleGauge className={iconClass} />}>
            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div>
                <p className="text-sm leading-6 text-stone-700">{summaryBlurb}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-sm bg-stone-200">
                  <div className="h-full bg-moss" style={{ width: `${tierProgress}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-stone-600">
                  <span>{seniority.label}</span>
                  <span>{nextTier ? `${nextTier.label} at ${nextTier.minXp} XP` : "Top tier"}</span>
                </div>
              </div>
              <div className="rounded-md border border-fern bg-fern/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-bark">
                  <MessageSquareText className={iconClass} aria-hidden="true" />
                  Mycelium
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  Open the Community pane to ask what needs doing next—or surface commitments from your group.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Add Target" icon={<Plus className={iconClass} />}>
            <div className="grid gap-3">
              <input
                className={inputBase}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Concrete next action"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className={inputBase}
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
                <select className={inputBase} value={subarea} onChange={(event) => setSubarea(event.target.value)}>
                  {DEFAULT_SUBAREAS[domain].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  className={inputBase}
                  value={resistance}
                  onChange={(event) => setResistance(event.target.value as XpInput["resistance"])}
                >
                  <option value="low">Low resistance</option>
                  <option value="medium">Medium resistance</option>
                  <option value="high">High resistance</option>
                  <option value="avoidant">Avoidant</option>
                </select>
                <label className="flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm">
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
                disabled={!supabase}
                onClick={addGoal}
              >
                <Plus className={iconClass} aria-hidden="true" />
                Add {suggested.xp} XP target
              </button>
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr_0.8fr]">
          <Panel title="Targets" icon={<CheckCircle2 className={iconClass} />}>
            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-sm text-stone-600">No active targets—add one or complete onboarding goals.</p>
              ) : null}
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => completeGoal(goal)}
                  className="flex w-full items-start gap-3 rounded-md border border-stone-300 bg-white p-3 text-left transition hover:border-moss"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-stone-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{goal.title}</span>
                    <span className="mt-1 block text-xs text-stone-600">
                      {goal.subarea ?? goal.domain} · tap to mark done
                    </span>
                  </span>
                  <span className="rounded-sm bg-marigold/20 px-2 py-1 text-xs font-semibold text-bark">
                    {goal.xp_value} XP
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Community" icon={<CalendarCheck className={iconClass} />}>
            <div className="space-y-3">
              <CommunityRow
                label="Your spaces"
                value={communityLabels.length ? `${communityLabels.length} joined` : "Join via Communities"}
                detail={communityLabels.join(", ") || "grove-welcome"}
              />
              <CommunityRow label="Next step" value="Open feed" detail="Commitments + wins" />
            </div>
          </Panel>

          <Panel title="Rewards" icon={<Coins className={iconClass} />}>
            <div className="space-y-3">
              <Reward label="Guilt-free game session" points="40 pts" />
              <Reward label="Protected rest block" points="35 pts" />
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Panel title="Recent XP" icon={<Library className={iconClass} />}>
            <div className="grid gap-3 md:grid-cols-2">
              {xpEvents.length === 0 ? (
                <p className="text-sm text-stone-600">Complete a target to log XP here.</p>
              ) : (
                xpEvents.slice(0, 8).map((item) => (
                  <article key={item.id} className="rounded-md border border-stone-300 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-moss">event</span>
                      <span className="text-xs font-semibold text-clay">+{item.xp} XP</span>
                    </div>
                    <h2 className="mt-3 text-sm font-semibold leading-snug">{item.reason}</h2>
                    <p className="mt-2 text-xs text-stone-600">{new Date(item.created_at).toLocaleString()}</p>
                  </article>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Support" icon={<MessageSquareText className={iconClass} />}>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Account" value={displayName} />
              <InfoRow label="Private focus data" value="Only you + RLS" />
            </dl>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-stone-300 bg-white/85 p-4 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-moss">{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-300 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-stone-600">
        <span className="text-moss">{icon}</span>
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function CommunityRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-stone-300 bg-white px-3 py-2">
      <div>
        <div className="text-sm font-medium">{value}</div>
        <div className="text-xs text-stone-600">{label}</div>
      </div>
      <div className="max-w-[40%] text-right text-xs text-stone-600">{detail}</div>
    </div>
  );
}

function Reward({ label, points }: { label: string; points: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm">
      <span>{label}</span>
      <span className="font-semibold text-clay">{points}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-stone-600">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
