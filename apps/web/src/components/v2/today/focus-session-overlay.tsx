"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { DOPAMINE_APPETISERS } from "@/components/v2/today/dopamine-menu";
import {
  SPRINT_PRESETS,
  type FocusSession,
  type FocusTask,
  type SprintPreset,
} from "@/hooks/use-focus-session";
import type { TaskRowData } from "@/components/v2/today/task-row";

type FocusSessionOverlayProps = {
  session: FocusSession;
  availableTasks: TaskRowData[];
  onTaskCompleted: (taskId: string) => void;
};

const ENDING_COUNTDOWN_SECONDS = 5;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TimerRing({ secondsRemaining, totalSeconds }: { secondsRemaining: number; totalSeconds: number }) {
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const degrees = progress * 360;

  return (
    <div className="relative mx-auto h-44 w-44">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#6b9080 ${degrees}deg, rgba(255,255,255,0.08) ${degrees}deg)`,
        }}
      />
      <div className="absolute inset-2 flex items-center justify-center rounded-full bg-zinc-950">
        <span className="font-mono text-4xl font-semibold tabular-nums text-white">
          {formatTime(secondsRemaining)}
        </span>
      </div>
    </div>
  );
}

function TaskSelectPanel({
  tasks,
  onConfirm,
  onCancel,
}: {
  tasks: TaskRowData[];
  onConfirm: (picked: FocusTask[], minutes: SprintPreset) => void;
  onCancel: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<SprintPreset>(15);
  const openTasks = tasks.filter((t) => !t.completed);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Pick 1–3 tasks to focus on</h2>
        <p className="mt-1 text-sm text-zinc-400">Choose a sprint length, then lock in.</p>
      </div>

      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {openTasks.length === 0 ? (
          <li className="text-sm text-zinc-400">No open tasks. Add one first.</li>
        ) : (
          openTasks.map((task) => {
            const checked = selectedIds.includes(task.id);
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  className={twMerge(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                    checked
                      ? "border-moss bg-moss/15 text-white"
                      : "border-zinc-700 text-zinc-200 hover:border-zinc-500",
                  )}
                >
                  <span
                    className={twMerge(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked ? "border-moss bg-moss" : "border-zinc-500",
                    )}
                  >
                    {checked ? <span className="text-[10px] text-white">✓</span> : null}
                  </span>
                  {task.title}
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Sprint length</p>
        <div className="flex flex-wrap gap-2">
          {SPRINT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMinutes(preset)}
              className={twMerge(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                minutes === preset
                  ? "bg-moss text-moss-fg"
                  : "border border-zinc-600 text-zinc-300 hover:border-zinc-400",
              )}
            >
              {preset} min
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-600 py-2.5 text-sm font-medium text-zinc-300"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={() => {
            const picked = openTasks
              .filter((t) => selectedIds.includes(t.id))
              .map((t) => ({ id: t.id, title: t.title }));
            onConfirm(picked, minutes);
          }}
          className="flex-1 rounded-xl bg-moss py-2.5 text-sm font-semibold text-moss-fg disabled:opacity-40"
        >
          Start session
        </button>
      </div>
    </div>
  );
}

export function FocusSessionOverlay({ session, availableTasks, onTaskCompleted }: FocusSessionOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [rewardLogged, setRewardLogged] = useState(false);
  const [endingCountdown, setEndingCountdown] = useState(ENDING_COUNTDOWN_SECONDS);

  const {
    phase,
    selectedTasks,
    currentTaskIndex,
    sprintMinutes,
    secondsRemaining,
    breakAppetiser,
    summary,
    confirmTaskSelect,
    markTaskDone,
    pauseSession,
    resumeSession,
    requestEnd,
    confirmEnd,
    cancelEnd,
    skipBreak,
    dismissDone,
    setBreakAppetiser,
    reset,
  } = session;

  const currentTask = selectedTasks[currentTaskIndex] ?? null;
  const sprintTotalSeconds = sprintMinutes * 60;

  const appetiser = useMemo(() => {
    if (breakAppetiser) return breakAppetiser;
    const idx = Math.floor(Math.random() * DOPAMINE_APPETISERS.length);
    return DOPAMINE_APPETISERS[idx] ?? DOPAMINE_APPETISERS[0];
  }, [breakAppetiser]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (phase === "break" && !breakAppetiser) {
      setBreakAppetiser(appetiser);
    }
  }, [phase, breakAppetiser, appetiser, setBreakAppetiser]);

  useEffect(() => {
    if (phase !== "done" || rewardLogged || summary.completedSprints < 1) return;
    setRewardLogged(true);
    void fetch("/api/v2/focus-session/reward", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sprints: summary.completedSprints }),
    });
  }, [phase, rewardLogged, summary.completedSprints]);

  useEffect(() => {
    if (phase !== "ending") {
      setEndingCountdown(ENDING_COUNTDOWN_SECONDS);
      return;
    }

    setEndingCountdown(ENDING_COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setEndingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          confirmEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, confirmEnd]);

  async function handleMarkDone() {
    if (!currentTask) return;
    const res = await fetch(`/api/v2/tasks/${currentTask.id}/complete`, { method: "POST" });
    if (res.ok) {
      onTaskCompleted(currentTask.id);
      markTaskDone();
    }
  }

  if (!mounted || phase === "idle") return null;

  const showHeaderClose = phase === "task-select" || phase === "transition";

  const content = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white">
      {showHeaderClose ? (
        <div className="flex items-center justify-end p-4">
          <button
            type="button"
            onClick={() => {
              if (phase === "task-select") reset();
              else requestEnd();
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            {phase === "task-select" ? "Close" : "End session"}
          </button>
        </div>
      ) : (
        <div className="h-4 shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        {phase === "task-select" ? (
          <TaskSelectPanel
            tasks={availableTasks}
            onConfirm={confirmTaskSelect}
            onCancel={reset}
          />
        ) : null}

        {phase === "running" && currentTask ? (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between py-6">
            <div className="w-full space-y-8 text-center">
              <TimerRing secondsRemaining={secondsRemaining} totalSeconds={sprintTotalSeconds} />
              <p className="text-2xl font-semibold leading-snug text-white">{currentTask.title}</p>
            </div>
            <div className="w-full space-y-4">
              <button
                type="button"
                onClick={() => void handleMarkDone()}
                className="w-full rounded-xl bg-moss py-3 text-sm font-semibold text-moss-fg"
              >
                Done — next →
              </button>
              <button
                type="button"
                onClick={pauseSession}
                className="w-full rounded-xl border border-zinc-600 py-2.5 text-sm font-medium text-zinc-200"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={requestEnd}
                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300"
              >
                End
              </button>
            </div>
          </div>
        ) : null}

        {phase === "paused" ? (
          <div className="mx-auto w-full max-w-md space-y-8 text-center">
            <p className="text-3xl font-semibold text-white">Paused.</p>
            <p className="font-mono text-4xl tabular-nums text-zinc-300">{formatTime(secondsRemaining)}</p>
            <button
              type="button"
              onClick={resumeSession}
              className="w-full rounded-xl bg-moss py-3 text-sm font-semibold text-moss-fg"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={requestEnd}
              className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
            >
              End session
            </button>
          </div>
        ) : null}

        {phase === "ending" ? (
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <p className="text-5xl font-semibold tabular-nums text-white">{endingCountdown}</p>
            <p className="text-lg text-zinc-300">Ending in {endingCountdown}…</p>
            <button
              type="button"
              onClick={cancelEnd}
              className="text-sm font-medium text-zinc-400 underline-offset-2 hover:text-white hover:underline"
            >
              Continue session
            </button>
          </div>
        ) : null}

        {phase === "transition" && selectedTasks[currentTaskIndex + 1] ? (
          <div className="mx-auto max-w-md space-y-6 text-center">
            <TimerRing secondsRemaining={secondsRemaining} totalSeconds={10} />
            <p className="text-lg leading-relaxed text-zinc-200">
              Take a breath. Read the next task title. Begin when ready.
            </p>
            <p className="text-sm text-zinc-400">Next: {selectedTasks[currentTaskIndex + 1].title}</p>
          </div>
        ) : null}

        {phase === "break" ? (
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between py-6">
            <div className="w-full space-y-8 text-center">
              <TimerRing secondsRemaining={secondsRemaining} totalSeconds={5 * 60} />
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Appetiser</p>
                <p className="mt-2 text-sm text-zinc-200">{breakAppetiser || appetiser}</p>
              </div>
            </div>
            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={skipBreak}
                className="text-sm font-medium text-zinc-400 underline-offset-2 hover:text-white hover:underline"
              >
                Skip break
              </button>
              <button
                type="button"
                onClick={requestEnd}
                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300"
              >
                Back to Grove
              </button>
            </div>
          </div>
        ) : null}

        {phase === "done" ? (
          <div className="mx-auto max-w-md space-y-6 text-center">
            <h2 className="text-2xl font-semibold text-white">Session complete</h2>
            <p className="text-zinc-300">
              You completed {summary.completedTasks} task{summary.completedTasks === 1 ? "" : "s"} in{" "}
              {summary.elapsedMinutes} min
              {summary.completedSprints > 0 ? ` · +${summary.completedSprints * 20} XP` : ""}
            </p>
            <button
              type="button"
              onClick={dismissDone}
              className="rounded-xl bg-moss px-6 py-2.5 text-sm font-semibold text-moss-fg"
            >
              Back to Grove
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
