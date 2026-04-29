"use client";

import { useMemo, useState } from "react";
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
  type GoalDraft,
  type LifeDomainId,
  type XpInput,
} from "@grove/core";
import { communityFeed, demoGoals, demoProfile } from "@/lib/demo-data";
import { NavLinks } from "@/components/nav-links";

type GoalState = GoalDraft & {
  id: string;
  done: boolean;
};

const iconClass = "h-4 w-4";

const inputBase =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-moss/20 transition focus:border-moss focus:ring-4";

export function GroveDashboard() {
  const [goals, setGoals] = useState<GoalState[]>(
    demoGoals.map((goal, index) => ({ ...goal, id: `${index}`, done: false })),
  );
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<LifeDomainId>("learning");
  const [subarea, setSubarea] = useState(DEFAULT_SUBAREAS.learning[0]);
  const [resistance, setResistance] = useState<XpInput["resistance"]>("medium");
  const [communityContribution, setCommunityContribution] = useState(false);

  const completedXp = goals.filter((goal) => goal.done).reduce((sum, goal) => sum + goal.xp, 0);
  const totalXp = demoProfile.totalXp + completedXp;
  const seniority = getSeniorityTier(totalXp);
  const nextTier = getNextSeniorityTier(totalXp);
  const tierProgress = nextTier
    ? Math.min(100, Math.round(((totalXp - seniority.minXp) / (nextTier.minXp - seniority.minXp)) * 100))
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

  function addGoal() {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    setGoals((current) => [
      {
        id: crypto.randomUUID(),
        title: trimmed,
        domain,
        subarea,
        dueAt: "This week",
        xp: suggested.xp,
        done: false,
      },
      ...current,
    ]);
    setTitle("");
  }

  function toggleGoal(id: string) {
    setGoals((current) =>
      current.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal)),
    );
  }

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
            <Metric icon={<Sprout className={iconClass} />} label={seniority.label} value={`${totalXp} XP`} />
            <Metric icon={<Users className={iconClass} />} label="Community" value="AgentsForGood" />
            <Metric icon={<Bell className={iconClass} />} label="Nudges" value="Email + app" />
          </div>
          <NavLinks />
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Today" icon={<CircleGauge className={iconClass} />}>
            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div>
                <p className="text-sm leading-6 text-stone-700">{demoProfile.summary}</p>
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
                  AgentsForGood has one open commitment tied to your Grove build. Share the repo scaffold after the
                  first commit so the group can follow progress.
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
                className="inline-flex items-center justify-center gap-2 rounded-md bg-bark px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
                type="button"
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
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className="flex w-full items-start gap-3 rounded-md border border-stone-300 bg-white p-3 text-left transition hover:border-moss"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${
                      goal.done ? "border-moss bg-moss text-white" : "border-stone-400"
                    }`}
                  >
                    {goal.done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-medium ${goal.done ? "text-stone-500 line-through" : ""}`}>
                      {goal.title}
                    </span>
                    <span className="mt-1 block text-xs text-stone-600">
                      {goal.subarea} · {goal.dueAt}
                    </span>
                  </span>
                  <span className="rounded-sm bg-marigold/20 px-2 py-1 text-xs font-semibold text-bark">
                    {goal.xp} XP
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Community" icon={<CalendarCheck className={iconClass} />}>
            <div className="space-y-3">
              <CommunityRow label="Next session" value="AI agents build night" detail="Friday, 5:00 PM" />
              <CommunityRow label="Open commitments" value="3" detail="1 assigned to you" />
              <CommunityRow label="Participation XP" value="+95" detail="this week" />
              <CommunityRow label="Newcomer context" value="Ready" detail="session archive summarized" />
            </div>
          </Panel>

          <Panel title="Rewards" icon={<Coins className={iconClass} />}>
            <div className="space-y-3">
              <Reward label="Guilt-free game session" points="40 pts" />
              <Reward label="Set next agenda topic" points="60 pts" />
              <Reward label="Protected rest block" points="35 pts" />
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Panel title="Feed" icon={<Library className={iconClass} />}>
            <div className="grid gap-3 md:grid-cols-3">
              {communityFeed.map((item) => (
                <article key={item.title} className="rounded-md border border-stone-300 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-moss">{item.kind}</span>
                    <span className="text-xs font-semibold text-clay">+{item.points} XP</span>
                  </div>
                  <h2 className="mt-3 text-base font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{item.body}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Support Style" icon={<MessageSquareText className={iconClass} />}>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Tone" value={demoProfile.supportStyle} />
              <InfoRow label="Private focus data" value="Only used for coaching" />
              <InfoRow label="Public preference" value="Open to peer check-ins" />
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
      <div className="text-right text-xs text-stone-600">{detail}</div>
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
