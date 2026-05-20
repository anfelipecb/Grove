"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { DomainTag } from "@/components/v2/shared/domain-tag";

export type TaskRowData = {
  id: string;
  title: string;
  domain: string;
  is_required: boolean;
  is_community_task: boolean;
  point_value: number;
  community_point_value: number;
  completed: boolean;
  preferred_time?: string;
};

const PREFERRED_TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

type TaskRowProps = {
  task: TaskRowData;
  onComplete: (id: string) => Promise<void>;
  onStart?: (taskId: string) => void;
  scheduledTime?: string | null;
  onMoveToTomorrow?: (taskId: string) => Promise<void>;
};

export function TaskRow({ task, onComplete, onStart, scheduledTime, onMoveToTomorrow }: TaskRowProps) {
  const [moving, setMoving] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    if (task.completed || loading) return;
    setLoading(true);
    try {
      await onComplete(task.id);
    } finally {
      setLoading(false);
    }
  }

  const totalPts = task.point_value + (task.is_community_task ? task.community_point_value : 0);

  return (
    <div className={twMerge("flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0", task.completed && "opacity-60")}>
      <button
        onClick={handleCheck}
        disabled={task.completed || loading}
        aria-label={task.completed ? "Completed" : `Complete ${task.title}`}
        className={twMerge(
          "h-5 w-5 shrink-0 rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2",
          task.completed
            ? "border-moss bg-moss flex items-center justify-center"
            : "border-moss/50 bg-moss/10 hover:border-moss hover:bg-moss/20",
          loading && "animate-pulse",
        )}
      >
        {task.completed && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className={twMerge("min-w-0 flex-1 truncate text-sm text-foreground", task.completed && "line-through")}>
            {task.title}
          </p>
          {!task.completed && onStart ? (
            <button
              type="button"
              onClick={() => onStart(task.id)}
              className="shrink-0 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {scheduledTime ? "Reschedule" : "Start →"}
            </button>
          ) : null}
          {!task.completed && onMoveToTomorrow ? (
            <button
              type="button"
              disabled={moving}
              onClick={() => {
                setMoving(true);
                void onMoveToTomorrow(task.id).finally(() => setMoving(false));
              }}
              className="shrink-0 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              {moving ? "…" : "Tomorrow"}
            </button>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {scheduledTime ? (
            <span className="text-[11px] text-muted-foreground">📅 {scheduledTime}</span>
          ) : null}
          <DomainTag domain={task.domain} />
          {task.preferred_time && task.preferred_time !== "flexible" && (
            <span className="text-[11px] text-muted-foreground">
              {PREFERRED_TIME_LABELS[task.preferred_time] ?? task.preferred_time}
            </span>
          )}
          {task.is_community_task && (
            <span className="text-xs text-violet-500">also earns community pts</span>
          )}
        </div>
      </div>

      <span className={twMerge("shrink-0 text-xs font-semibold tabular-nums", task.is_community_task ? "text-orange-500" : "text-moss")}>
        +{totalPts}
      </span>
    </div>
  );
}
