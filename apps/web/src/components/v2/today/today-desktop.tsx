"use client";

import { useEffect, useState } from "react";
import { Sparkles, Gift, Plus } from "lucide-react";
import { FindTimePanel } from "@/components/v2/today/find-time-panel";
import { CalendarTab } from "@/components/v2/today/calendar-tab";
import { twMerge } from "tailwind-merge";
import { getSurpriseUnlocks, type ProgressionSnapshot } from "@grove/core";
import { TaskRow, type TaskRowData } from "@/components/v2/today/task-row";
import { DayLog } from "@/components/v2/today/day-log";
import { PlanTomorrow } from "@/components/v2/today/plan-tomorrow";
import { TodayStatsRow } from "@/components/v2/today/today-stats-row";
import { DomainProgressBars } from "@/components/v2/today/domain-progress-bars";
import { AddTaskSheet } from "@/components/v2/today/add-task-sheet";
import { StartTaskSheet } from "@/components/v2/today/start-task-sheet";
import { FocusSessionOverlay } from "@/components/v2/today/focus-session-overlay";
import { TaskChatOverlay } from "@/components/v2/today/task-chat-overlay";
import { useFocusSession } from "@/hooks/use-focus-session";
import { CommunityPulseCard } from "@/components/v2/community/community-pulse-card";
import { surfacePrimary, surfaceSecondary } from "@/components/v2/today/surface-classes";

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
  googleCalendarConnected?: boolean;
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
  googleCalendarConnected = false,
}: TodayDesktopProps) {
  const [activeView, setActiveView] = useState<"today" | "calendar">("today");
  const todayDate = new Date();
  const today = toDateStr(todayDate);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDateStr(tomorrowDate);

  const [localTasks, setLocalTasks] = useState(tasks);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showTaskChat, setShowTaskChat] = useState(false);
  const [addPrefill, setAddPrefill] = useState<{ title: string; domain: string } | null>(null);
  const [startTaskId, setStartTaskId] = useState<string | null>(null);
  const [startedTasks, setStartedTasks] = useState<Record<string, string>>({});
  const session = useFocusSession();

  const startTask = startTaskId ? localTasks.find((t) => t.id === startTaskId) : null;

  const required = localTasks.filter((t) => t.is_required);
  const goal = localTasks.filter((t) => !t.is_required);
  const hasTasks = required.length > 0 || goal.length > 0;

  const [nudge, setNudge] = useState<CoachSuggestion | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(true);
  const [nudgeWhyOpen, setNudgeWhyOpen] = useState(false);
  const [unlocksOpen, setUnlocksOpen] = useState(false);

  useEffect(() => {
    fetch("/api/ai/coach-suggestions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId }) })
      .then((r) => r.json())
      .then((data: { suggestions?: CoachSuggestion[] }) => {
        const first = data.suggestions?.[0] ?? null;
        setNudge(first);
      })
      .catch(() => setNudge(null))
      .finally(() => setNudgeLoading(false));
  }, [profileId]);

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
    <div>
      {session.phase !== "idle" ? (
        <FocusSessionOverlay
          session={session}
          availableTasks={localTasks}
          onTaskCompleted={(taskId) =>
            setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)))
          }
        />
      ) : null}

      <div className="mb-4 flex gap-1 rounded-full border border-border bg-muted/30 p-1 w-fit">
        {(["today", "calendar"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={twMerge(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeView === view
                ? "bg-moss text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {view === "today" ? "Today" : "Calendar"}
          </button>
        ))}
      </div>

      {activeView === "calendar" ? (
        <CalendarTab activeTasks={activeTasks} googleCalendarConnected={googleCalendarConnected} />
      ) : (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {showTaskChat && (
        <TaskChatOverlay
          onClose={() => setShowTaskChat(false)}
          onAdd={(task) => {
            setLocalTasks((prev) => [task, ...prev]);
            setShowTaskChat(false);
          }}
          onQuickAdd={() => {
            setShowTaskChat(false);
            setAddPrefill(null);
            setShowAddSheet(true);
          }}
        />
      )}

      {startTask ? (
        <StartTaskSheet
          taskId={startTask.id}
          taskTitle={startTask.title}
          onClose={() => setStartTaskId(null)}
          onScheduled={(id, label) => {
            setStartedTasks((prev) => ({ ...prev, [id]: label }));
            setStartTaskId(null);
          }}
          onScheduleAndFocus={(id, label) => {
            setStartedTasks((prev) => ({ ...prev, [id]: label }));
            setStartTaskId(null);
            session.startWithTasks([{ id: startTask.id, title: startTask.title }]);
          }}
        />
      ) : null}

      {showAddSheet && (
        <AddTaskSheet
          key={addPrefill ? `pulse-${addPrefill.title.slice(0, 24)}` : "manual"}
          initialTitle={addPrefill?.title}
          initialDomain={addPrefill?.domain}
          onClose={() => {
            setShowAddSheet(false);
            setAddPrefill(null);
          }}
          onAdd={(task) => setLocalTasks((prev) => [task, ...prev])}
        />
      )}

      {/* LEFT COLUMN */}
      <div className="space-y-4">
        <TodayStatsRow doneTodayCount={doneTodayCount} pointsToday={pointsToday} streak={streak} />

        <div className={`${surfacePrimary} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Today</p>
            {hasTasks ? (
              <button
                type="button"
                onClick={() => {
                  setAddPrefill(null);
                  setShowTaskChat(true);
                }}
                className="flex items-center gap-1 rounded-lg bg-moss px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-moss/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </button>
            ) : null}
          </div>

          {required.length > 0 && (
            <section className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Required by coach
              </p>
              {required.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onComplete={handleComplete}
                  onStart={t.completed ? undefined : () => setStartTaskId(t.id)}
                  scheduledTime={startedTasks[t.id] ?? null}
                />
              ))}
            </section>
          )}

          {goal.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your goals
              </p>
              {goal.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onComplete={handleComplete}
                  onStart={t.completed ? undefined : () => setStartTaskId(t.id)}
                  scheduledTime={startedTasks[t.id] ?? null}
                />
              ))}
            </section>
          )}

          {required.length === 0 && goal.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
              <button
                onClick={() => {
                  setAddPrefill(null);
                  setShowTaskChat(true);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-moss/90"
              >
                <Plus className="h-4 w-4" /> Add task
              </button>
            </div>
          )}
        </div>

        <DomainProgressBars domainPoints={domainPoints} />
      </div>

      {/* CENTER COLUMN */}
      <div className="space-y-4">
        <div className={`${surfaceSecondary} p-4`}>
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
        <div className={`${surfaceSecondary} p-3`}>
          <div className="mb-2 flex items-center gap-2">
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
              <p className="text-sm font-medium text-foreground line-clamp-2">{nudge.title}</p>
              {nudge.reason ? (
                <>
                  <button
                    type="button"
                    onClick={() => setNudgeWhyOpen((v) => !v)}
                    className="mt-1 text-[11px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {nudgeWhyOpen ? "Hide" : "Why?"}
                  </button>
                  {nudgeWhyOpen ? (
                    <p className="mt-1 text-xs text-muted-foreground">{nudge.reason}</p>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasTasks ? (
          <>
            <CommunityPulseCard
              profileId={profileId}
              fallbackPulse={communityPulse}
              onAddSuggested={(title, domain) => {
                setAddPrefill({ title, domain });
                setShowAddSheet(true);
              }}
            />
            <FindTimePanel />
          </>
        ) : null}

        {nextUnlocks.length > 0 ? (
          <div className={`${surfaceSecondary} p-3`}>
            <button
              type="button"
              onClick={() => setUnlocksOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-marigold" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {nextUnlocks.length === 1
                    ? "Next unlock"
                    : `${nextUnlocks.length} unlocks in progress`}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">{unlocksOpen ? "Hide" : "Show"}</span>
            </button>
            {unlocksOpen ? (
              <div className="mt-3 space-y-3">
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 truncate text-xs text-muted-foreground">{nextUnlocks[0].label}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
      )}
    </div>
  );
}
