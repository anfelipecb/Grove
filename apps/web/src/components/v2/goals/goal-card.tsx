"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { DomainTag } from "@/components/v2/shared/domain-tag";

const DOMAIN_ACCENTS: Record<string, { bar: string; ring: string; soft: string }> = {
  wellbeing: {
    bar: "bg-emerald-500",
    ring: "text-emerald-500",
    soft: "bg-emerald-500/10",
  },
  learning: {
    bar: "bg-blue-500",
    ring: "text-blue-500",
    soft: "bg-blue-500/10",
  },
  work_build: {
    bar: "bg-orange-500",
    ring: "text-orange-500",
    soft: "bg-orange-500/10",
  },
  relationships: {
    bar: "bg-pink-500",
    ring: "text-pink-500",
    soft: "bg-pink-500/10",
  },
  community: {
    bar: "bg-violet-500",
    ring: "text-violet-500",
    soft: "bg-violet-500/10",
  },
  life_admin: {
    bar: "bg-slate-500",
    ring: "text-slate-500",
    soft: "bg-slate-500/10",
  },
  rest_play: {
    bar: "bg-amber-500",
    ring: "text-amber-500",
    soft: "bg-amber-500/10",
  },
};

const FREQUENCY_LABELS: Record<GoalTask["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  once: "One-off",
};

export type GoalTask = {
  id: string;
  title: string;
  domain: string;
  is_required: boolean;
  is_community_task: boolean;
  point_value: number;
  community_point_value: number;
  preferred_time?: string | null;
  frequency: "daily" | "weekly" | "once";
  completedToday: boolean;
  completedThisWeek: boolean;
};

export type GoalCardData = {
  id: string;
  title: string;
  domain: string;
  tasks: GoalTask[];
};

type GoalCardProps = {
  goal: GoalCardData;
  canQuickAddTask: boolean;
  onAddTask: (goalId: string, title: string) => Promise<void>;
  onCompleteTask: (goalId: string, taskId: string) => Promise<void>;
};

function ProgressRing({ completed, total, ringClass }: { completed: number; total: number; ringClass: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="-rotate-90 h-20 w-20" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} className="fill-none stroke-border/60" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className={twMerge("fill-none transition-all duration-300", ringClass)}
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base font-semibold text-foreground">{completed}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">of {total || 0}</span>
      </div>
    </div>
  );
}

export function GoalCard({ goal, canQuickAddTask, onAddTask, onCompleteTask }: GoalCardProps) {
  const [expanded, setExpanded] = useState(goal.tasks.length > 0);
  const [draftTitle, setDraftTitle] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accents = DOMAIN_ACCENTS[goal.domain] ?? {
    bar: "bg-moss",
    ring: "text-moss",
    soft: "bg-moss/10",
  };
  const completedThisWeekCount = goal.tasks.filter((task) => task.completedThisWeek).length;

  async function handleCompleteTask(taskId: string) {
    if (busyTaskId) return;

    setBusyTaskId(taskId);
    setError(null);

    try {
      await onCompleteTask(goal.id, taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete task.");
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleAddTask() {
    const title = draftTitle.trim();
    if (!title) {
      setError("Task title is required.");
      return;
    }

    setSavingTask(true);
    setError(null);

    try {
      await onAddTask(goal.id, title);
      setDraftTitle("");
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task.");
    } finally {
      setSavingTask(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[28px] border border-border bg-card/95 shadow-panel dark:shadow-panel-dark">
      <div className={twMerge("h-1.5 w-full", accents.bar)} />
      <div className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DomainTag domain={goal.domain} className={twMerge("rounded-full px-2.5 py-1", accents.soft)} />
              <span className="text-xs font-medium text-muted-foreground">
                {goal.tasks.length} active task{goal.tasks.length === 1 ? "" : "s"}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{goal.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {completedThisWeekCount} of {goal.tasks.length} active tasks checked off this week.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProgressRing completed={completedThisWeekCount} total={goal.tasks.length} ringClass={accents.ring} />
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
              aria-expanded={expanded}
              aria-label={expanded ? `Collapse ${goal.title}` : `Expand ${goal.title}`}
            >
              <ChevronDown className={twMerge("h-5 w-5 transition-transform", expanded && "rotate-180")} />
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="mt-5 border-t border-border pt-4">
            <div className="space-y-2.5">
              {goal.tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-5 text-sm text-muted-foreground">
                  No tasks yet. Add a first step below so this goal has something concrete to act on.
                </div>
              ) : (
                goal.tasks.map((task) => {
                  const totalPoints = task.point_value + (task.is_community_task ? task.community_point_value : 0);
                  const busy = busyTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={twMerge(
                        "flex items-start gap-3 rounded-2xl border border-border bg-background/80 px-3 py-3 transition",
                        task.completedToday && "opacity-70",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => void handleCompleteTask(task.id)}
                        disabled={task.completedToday || busy}
                        className={twMerge(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                          task.completedToday ? "border-moss bg-moss text-white" : "border-border hover:border-moss",
                        )}
                        aria-label={task.completedToday ? `${task.title} completed today` : `Complete ${task.title}`}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : task.completedToday ? <Check className="h-3.5 w-3.5" /> : null}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={twMerge("text-sm font-medium text-foreground", task.completedToday && "line-through")}>
                            {task.title}
                          </p>
                          {task.completedThisWeek && !task.completedToday ? (
                            <span className="rounded-full bg-moss/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">
                              Done this week
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded-full border border-border px-2 py-0.5">{FREQUENCY_LABELS[task.frequency]}</span>
                          {task.is_required ? <span className="rounded-full border border-border px-2 py-0.5">Coach required</span> : null}
                          {task.preferred_time && task.preferred_time !== "flexible" ? (
                            <span className="rounded-full border border-border px-2 py-0.5 capitalize">{task.preferred_time}</span>
                          ) : null}
                        </div>
                      </div>

                      <span className="shrink-0 text-xs font-semibold text-moss">+{totalPoints}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background/70 p-3">
              <label htmlFor={`goal-task-${goal.id}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Add task to goal
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id={`goal-task-${goal.id}`}
                  type="text"
                  value={draftTitle}
                  onChange={(event) => {
                    setDraftTitle(event.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAddTask();
                    }
                  }}
                  placeholder="Quick add a concrete next step"
                  disabled={!canQuickAddTask || savingTask}
                  maxLength={140}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-moss/20 transition focus:border-moss focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void handleAddTask()}
                  disabled={!canQuickAddTask || savingTask}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-moss px-4 py-2.5 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add task
                </button>
              </div>
              {!canQuickAddTask ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Quick add is unavailable in demo mode right now. Use the Coach flow to add tasks in demo.
                </p>
              ) : null}
              {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
