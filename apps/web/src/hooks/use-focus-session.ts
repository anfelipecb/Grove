"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SPRINT_PRESETS = [10, 15, 25, 45] as const;
export type SprintPreset = (typeof SPRINT_PRESETS)[number];

export type FocusPhase =
  | "idle"
  | "task-select"
  | "running"
  | "paused"
  | "ending"
  | "transition"
  | "break"
  | "done";

export type FocusTask = {
  id: string;
  title: string;
};

export type FocusSessionSummary = {
  completedSprints: number;
  completedTasks: number;
  elapsedMinutes: number;
};

const TRANSITION_SECONDS = 10;
const BREAK_SECONDS = 5 * 60;

export function useFocusSession() {
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [selectedTasks, setSelectedTasks] = useState<FocusTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [sprintMinutes, setSprintMinutes] = useState<SprintPreset>(15);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [completedSprints, setCompletedSprints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [breakAppetiser, setBreakAppetiser] = useState("");
  const [phaseBeforeEnd, setPhaseBeforeEnd] = useState<"running" | "paused">("running");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setSelectedTasks([]);
    setCurrentTaskIndex(0);
    setSprintMinutes(15);
    setSecondsRemaining(0);
    setCompletedSprints(0);
    setCompletedTasks(0);
    setSessionStartedAt(null);
    setBreakAppetiser("");
    setPhaseBeforeEnd("running");
  }, [clearTimer]);

  const startTimer = useCallback(
    (seconds: number) => {
      clearTimer();
      setSecondsRemaining(seconds);
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer],
  );

  const goToBreak = useCallback(() => {
    setPhase("break");
    startTimer(BREAK_SECONDS);
  }, [startTimer]);

  const goToNextTaskOrBreak = useCallback(
    (taskIndex: number, taskCount: number, minutes: SprintPreset) => {
      if (taskIndex + 1 >= taskCount) {
        goToBreak();
        return;
      }
      const nextIndex = taskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      setPhase("transition");
      startTimer(TRANSITION_SECONDS);
    },
    [goToBreak, startTimer],
  );

  const startRunningTimer = useCallback(
    (minutes: SprintPreset) => {
      setPhase("running");
      startTimer(minutes * 60);
    },
    [startTimer],
  );

  // When countdown hits zero, advance the state machine.
  useEffect(() => {
    if (secondsRemaining !== 0) return;

    const currentPhase = phaseRef.current;
    if (
      currentPhase === "idle" ||
      currentPhase === "task-select" ||
      currentPhase === "done" ||
      currentPhase === "paused" ||
      currentPhase === "ending"
    ) {
      return;
    }

    if (currentPhase === "running") {
      setCompletedSprints((n) => n + 1);
      goToNextTaskOrBreak(currentTaskIndex, selectedTasks.length, sprintMinutes);
    } else if (currentPhase === "transition") {
      startRunningTimer(sprintMinutes);
    } else if (currentPhase === "break") {
      setPhase("done");
    }
  }, [
    secondsRemaining,
    currentTaskIndex,
    selectedTasks.length,
    sprintMinutes,
    goToNextTaskOrBreak,
    startRunningTimer,
  ]);

  const openTaskSelect = useCallback(() => {
    setPhase("task-select");
  }, []);

  const confirmTaskSelect = useCallback(
    (tasks: FocusTask[], minutes: SprintPreset) => {
      if (tasks.length === 0) return;
      const picked = tasks.slice(0, 3);
      setSelectedTasks(picked);
      setSprintMinutes(minutes);
      setCurrentTaskIndex(0);
      setCompletedSprints(0);
      setCompletedTasks(0);
      setSessionStartedAt(Date.now());
      startRunningTimer(minutes);
    },
    [startRunningTimer],
  );

  const markTaskDone = useCallback(() => {
    if (phaseRef.current !== "running") return;
    setCompletedTasks((n) => n + 1);
    setCompletedSprints((n) => n + 1);
    clearTimer();
    goToNextTaskOrBreak(currentTaskIndex, selectedTasks.length, sprintMinutes);
  }, [clearTimer, currentTaskIndex, selectedTasks.length, sprintMinutes, goToNextTaskOrBreak]);

  const pauseSession = useCallback(() => {
    if (phaseRef.current !== "running") return;
    clearTimer();
    setPhase("paused");
  }, [clearTimer]);

  const resumeSession = useCallback(() => {
    if (phaseRef.current !== "paused") return;
    setPhase("running");
    startTimer(secondsRemaining > 0 ? secondsRemaining : sprintMinutes * 60);
  }, [startTimer, secondsRemaining, sprintMinutes]);

  const requestEnd = useCallback(() => {
    const current = phaseRef.current;
    if (current !== "running" && current !== "paused") return;
    setPhaseBeforeEnd(current);
    clearTimer();
    setPhase("ending");
  }, [clearTimer]);

  const confirmEnd = useCallback(() => {
    if (phaseRef.current !== "ending") return;
    clearTimer();
    setPhase("done");
  }, [clearTimer]);

  const cancelEnd = useCallback(() => {
    if (phaseRef.current !== "ending") return;
    const returnTo = phaseBeforeEnd;
    setPhase(returnTo);
    if (returnTo === "running" && secondsRemaining > 0) {
      startTimer(secondsRemaining);
    }
  }, [phaseBeforeEnd, secondsRemaining, startTimer]);

  const endSession = useCallback(() => {
    clearTimer();
    setPhase("done");
  }, [clearTimer]);

  const skipBreak = useCallback(() => {
    clearTimer();
    setPhase("done");
  }, [clearTimer]);

  const dismissDone = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const elapsedMinutes =
    sessionStartedAt != null ? Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000)) : 0;

  const summary: FocusSessionSummary = {
    completedSprints,
    completedTasks,
    elapsedMinutes,
  };

  return {
    phase,
    selectedTasks,
    currentTaskIndex,
    sprintMinutes,
    secondsRemaining,
    completedSprints,
    completedTasks,
    breakAppetiser,
    summary,
    openTaskSelect,
    confirmTaskSelect,
    markTaskDone,
    pauseSession,
    resumeSession,
    requestEnd,
    confirmEnd,
    cancelEnd,
    endSession,
    skipBreak,
    dismissDone,
    setBreakAppetiser,
    reset,
  };
}

export type FocusSession = ReturnType<typeof useFocusSession>;
