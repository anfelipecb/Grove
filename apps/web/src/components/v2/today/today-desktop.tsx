"use client";

import { useEffect, useState } from "react";
import { Sparkles, Users, CalendarClock, Gift, Plus } from "lucide-react";
import { getSurpriseUnlocks, type ProgressionSnapshot } from "@grove/core";
import { TaskRow, type TaskRowData } from "@/components/v2/today/task-row";
import { DayLog } from "@/components/v2/today/day-log";
import { PlanTomorrow } from "@/components/v2/today/plan-tomorrow";
import { TodayStatsRow } from "@/components/v2/today/today-stats-row";
import { DomainProgressBars } from "@/components/v2/today/domain-progress-bars";
import { AddTaskSheet } from "@/components/v2/today/add-task-sheet";

type CommunityPulse = {
  communityName: string | null;
  memberCount: number;
  nextSessionTitle: string | null;
};

export type TodayDesktopProps = {
  tasks: TaskRowData[];
  activeTasks: { id: string; title: string; domain: string }[];
  domainPoints: Record<string, number>;
  doneTodayCount: number;
  pointsToday: number;
  streak: number;
  communityPulse: CommunityPulse;
  unlockedSurpriseIds: string[];
  profileId: string;
};

type CoachSuggestion = {
  title: string;
  domain?: string;
  reason?: string;
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function TodayDesktop({
  tasks,
  activeTasks,
  domainPoints,
  doneTodayCount,
  pointsToday,
  streak,
  communityPulse,
  unlockedSurpriseIds,
  profileId,
}: TodayDesktopProps) {
  const todayDate = new Date();
  const today = toDateStr(todayDate);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDateStr(tomorrowDate);

  const [localTasks, setLocalTasks] = useState(tasks);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const required = localTasks.filter((t) => t.is_required);
  const goal = localTasks.filter((t) => !t.is_required);

  const [nudge, setNudge] = useState<CoachSuggestion | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/coach-suggestions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId }) })
      .then((r) => r.json())
      .then((data: { suggestions?: CoachSuggestion[] }) => {
        const first = data.suggestions?.[0] ?? null;
        setNudge(first);
      })
      .catch(() => setNudge(null))
      .finally(() => setNudgeLoading(false));
  }, []);

  const handleComplete = async (id: string) => {
    setLocalTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
    const res = await fetch(`/api/v2/tasks/${id}/complete`, { method: "POST" });
    if (!res.ok) {
      setLocalTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
    }
  };

  // Build a minimal snapshot to get next locked surprises
  const snapshot: ProgressionSnapshot = {
    totalXp: Object.values(domainPoints).reduce((s, v) => s + v, 0),
    streakDays: streak,
    activeDaysLast7: 0,
    completedGoals: doneTodayCount,
    joinedCommunities: communityPulse.communityName ? 1 : 0,
    activeCommitments: 0,
    completedCommitments: 0,
    savedRewards: 0,
  };

  const allSurprises = getSurpriseUnlocks(snapshot);
  const nextUnlocks = allSurprises
    .filter((s) => !s.unlocked && !unlockedSurpriseIds.includes(s.id))
    .slice(0, 2);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {showAddSheet && (
        <AddTaskSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={(task) => setLocalTasks((prev) => [task, ...prev])}
        />
      )}

      {/* LEFT COLUMN */}
      <div className="space-y-4">
        <TodayStatsRow doneTodayCount={doneTodayCount} pointsToday={pointsToday} streak={streak} />

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today</p>
            <button
              onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-1 rounded-lg border border-moss/40 px-2.5 py-1 text-xs font-medium text-moss transition-colors hover:bg-moss/10"
            >
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </div>

          {required.length > 0 && (
            <section className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Required by coach
              </p>
              {required.map((t) => (
                <TaskRow key={t.id} task={t} onComplete={handleComplete} />
              ))}
            </section>
          )}

          {goal.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your goals
              </p>
              {goal.map((t) => (
                <TaskRow key={t.id} task={t} onComplete={handleComplete} />
              ))}
            </section>
          )}

          {required.length === 0 && goal.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-foreground">No tasks yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add a task above, or let Coach set up your goals.</p>
              <div className="mt-3 flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowAddSheet(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-moss px-4 py-2 text-sm font-semibold text-moss transition-colors hover:bg-moss/10"
                >
                  <Plus className="h-4 w-4" /> Add your first task
                </button>
                <a href="/coach" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                  Or start with Coach →
                </a>
              </div>
            </div>
          )}
        </div>

        <DomainProgressBars domainPoints={domainPoints} />
      </div>

      {/* CENTER COLUMN */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Today&apos;s Log
          </p>
          <DayLog date={today} />
          <PlanTomorrow tomorrow={tomorrow} activeTasks={activeTasks} />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-4">
        {/* Coach nudge */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-moss" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coach Nudge
            </p>
          </div>
          {nudgeLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ) : nudge ? (
            <div>
              <p className="text-sm font-medium text-foreground">{nudge.title}</p>
              {nudge.reason && (
                <p className="mt-1 text-xs text-muted-foreground">{nudge.reason}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keep going — you&apos;re making progress.</p>
          )}
        </div>

        {/* Community pulse */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-fern" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Community Pulse
            </p>
          </div>
          {communityPulse.communityName ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{communityPulse.communityName}</p>
              <p className="text-xs text-muted-foreground">
                {communityPulse.memberCount} member{communityPulse.memberCount !== 1 ? "s" : ""} active this week
              </p>
              {communityPulse.nextSessionTitle && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Next: {communityPulse.nextSessionTitle}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No community yet — join one from the Communities page.
            </p>
          )}
        </div>

        {/* Next unlocks */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-marigold" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Next Unlocks
            </p>
          </div>
          {nextUnlocks.length > 0 ? (
            <div className="space-y-3">
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
                  <p className="mt-1 text-[11px] text-muted-foreground">{unlock.remainingLabel}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">All current unlocks achieved!</p>
          )}
        </div>
      </div>
    </div>
  );
}
