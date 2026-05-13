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
};

type TaskRowProps = {
  task: TaskRowData;
  onComplete: (id: string) => Promise<void>;
};

export function TaskRow({ task, onComplete }: TaskRowProps) {
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
          "h-5 w-5 shrink-0 rounded-md border-2 transition-colors",
          task.completed
            ? "border-moss bg-moss/80 flex items-center justify-center"
            : "border-border hover:border-moss",
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
        <p className={twMerge("text-sm text-foreground truncate", task.completed && "line-through")}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <DomainTag domain={task.domain} />
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
