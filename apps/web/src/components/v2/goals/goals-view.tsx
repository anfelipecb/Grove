"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CheckCheck, ListTodo, Plus, Target } from "lucide-react";
import { CoachWizard } from "@/components/v2/coach/coach-wizard";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { GoalCard, type GoalCardData, type GoalTask } from "@/components/v2/goals/goal-card";
import { GoalsProgressSection } from "@/components/v2/goals/goals-progress-section";

const QUICK_TASK_POINT_VALUE = 14;

type GoalsViewProps = {
  demoMode: boolean;
  displayName: string;
  initialGoals: GoalCardData[];
  profileId: string;
  completions30d: { task_id: string; completed_date: string; domain: string }[];
  monthlyXp: number;
  today: string;
};

type InsertedTaskRow = {
  id: string;
  title: string;
  domain: string;
  is_required: boolean;
  is_community_task: boolean;
  point_value: number;
  community_point_value: number | null;
  preferred_time: string | null;
  frequency: string;
};

function normalizeInsertedTask(task: InsertedTaskRow): GoalTask {
  return {
    id: task.id,
    title: task.title,
    domain: task.domain,
    is_required: task.is_required,
    is_community_task: task.is_community_task,
    point_value: task.point_value,
    community_point_value: task.community_point_value ?? 0,
    preferred_time: task.preferred_time,
    frequency: task.frequency === "daily" || task.frequency === "weekly" ? task.frequency : "once",
    completedToday: false,
    completedThisWeek: false,
  };
}

export function GoalsView({
  demoMode,
  displayName,
  initialGoals,
  profileId,
  completions30d,
  monthlyXp,
  today,
}: GoalsViewProps) {
  const { getToken } = useAuth();
  const supabase = useMemo(
    () => (demoMode ? null : createBrowserSupabaseClient(() => getToken() ?? Promise.resolve(null))),
    [demoMode, getToken],
  );

  const [goals, setGoals] = useState(initialGoals);
  const [showWizard, setShowWizard] = useState(false);

  const totalGoals = goals.length;
  const totalTasks = goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
  const completedThisWeek = goals.reduce(
    (sum, goal) => sum + goal.tasks.filter((task) => task.completedThisWeek).length,
    0,
  );

  async function handleCompleteTask(goalId: string, taskId: string) {
    const targetGoal = goals.find((goal) => goal.id === goalId);
    const targetTask = targetGoal?.tasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.completedToday) return;

    const previousCompletedThisWeek = targetTask.completedThisWeek;

    setGoals((current) =>
      current.map((goal) =>
        goal.id !== goalId
          ? goal
          : {
              ...goal,
              tasks: goal.tasks.map((task) =>
                task.id === taskId ? { ...task, completedToday: true, completedThisWeek: true } : task,
              ),
            },
      ),
    );

    const response = await fetch(`/api/v2/tasks/${taskId}/complete`, { method: "POST" });
    if (!response.ok) {
      setGoals((current) =>
        current.map((goal) =>
          goal.id !== goalId
            ? goal
            : {
                ...goal,
                tasks: goal.tasks.map((task) =>
                  task.id === taskId
                    ? { ...task, completedToday: false, completedThisWeek: previousCompletedThisWeek }
                    : task,
                ),
              },
        ),
      );

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Could not complete task.");
    }
  }

  async function handleAddTask(goalId: string, title: string) {
    const goal = goals.find((entry) => entry.id === goalId);
    if (!goal) {
      throw new Error("Goal not found.");
    }

    if (!supabase) {
      throw new Error("Quick add is unavailable until Supabase auth is configured.");
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        profile_id: profileId,
        goal_id: goalId,
        title,
        domain: goal.domain,
        frequency: "once",
        preferred_time: "flexible",
        is_required: false,
        is_community_task: false,
        point_value: QUICK_TASK_POINT_VALUE,
        community_point_value: 0,
        status: "active",
      })
      .select("id, title, domain, is_required, is_community_task, point_value, community_point_value, preferred_time, frequency")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not create task.");
    }

    const nextTask = normalizeInsertedTask(data as InsertedTaskRow);

    setGoals((current) =>
      current.map((entry) =>
        entry.id === goalId
          ? {
              ...entry,
              tasks: [nextTask, ...entry.tasks],
            }
          : entry,
      ),
    );
  }

  if (showWizard) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <CoachWizard
          demoMode={demoMode}
          initialDisplayName={displayName}
          onCancel={() => setShowWizard(false)}
          profileId={profileId}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[32px] border border-border bg-card/95 shadow-panel dark:shadow-panel-dark">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(61,112,77,0.28),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Goals</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                Keep long-term direction visible while tasks stay small enough to do.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Each goal holds its own task stack, weekly progress, and quick-add lane so Coach planning does not get buried inside one tab.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-moss-fg transition hover:bg-moss/90"
            >
              <Plus className="h-4 w-4" />
              Add goal
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Active goals</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{totalGoals}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListTodo className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Active tasks</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{totalTasks}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Checked this week</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{completedThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-border bg-card/85 p-8 text-center shadow-panel dark:shadow-panel-dark">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">No active goals yet</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">Start with one meaningful direction.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Coach will turn a goal into manageable tasks. Once a goal exists here, you can track progress and add concrete follow-through steps directly from this page.
          </p>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-moss-fg transition hover:bg-moss/90"
          >
            <Plus className="h-4 w-4" />
            Add your first goal
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              canQuickAddTask={!demoMode}
              onAddTask={handleAddTask}
              onCompleteTask={handleCompleteTask}
            />
          ))}
        </div>
      )}

      <GoalsProgressSection completions30d={completions30d} monthlyXp={monthlyXp} today={today} />
    </section>
  );
}
