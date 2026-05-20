"use client";

import { useState } from "react";
import { useFocusSession } from "@/hooks/use-focus-session";
import { FocusSessionOverlay } from "@/components/v2/today/focus-session-overlay";
import { TodayTabs } from "@/components/v2/today/today-tabs";
import type { TaskRowData } from "@/components/v2/today/task-row";
import type { DopamineMainTask } from "@/components/v2/today/today-tabs";

type TodayMobileShellProps = {
  tasks: TaskRowData[];
  activeTasks: { id: string; title: string; domain: string }[];
  profileId: string;
  mainTask: DopamineMainTask | null;
  googleCalendarConnected: boolean;
};

export function TodayMobileShell({
  tasks: initialTasks,
  activeTasks,
  profileId,
  mainTask,
  googleCalendarConnected,
}: TodayMobileShellProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const session = useFocusSession();

  return (
    <>
      <TodayTabs
        tasks={tasks}
        activeTasks={activeTasks}
        profileId={profileId}
        mainTask={mainTask}
        googleCalendarConnected={googleCalendarConnected}
        onStartFocusSession={session.openTaskSelect}
      />
      {session.phase !== "idle" ? (
        <FocusSessionOverlay
          session={session}
          availableTasks={tasks}
          onTaskCompleted={(taskId) =>
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)))
          }
        />
      ) : null}
    </>
  );
}
