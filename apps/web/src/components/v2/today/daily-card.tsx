"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { TaskRow, type TaskRowData } from "@/components/v2/today/task-row";
import { DraggableTaskRow } from "@/components/v2/today/draggable-task-row";
import { LogSessionForm } from "@/components/v2/today/log-session-form";
import { AddTaskSheet } from "@/components/v2/today/add-task-sheet";
import { StartTaskSheet } from "@/components/v2/today/start-task-sheet";
import { TaskChatOverlay } from "@/components/v2/today/task-chat-overlay";
import { FindTimePanel } from "@/components/v2/today/find-time-panel";
import { CommunityPulseCard } from "@/components/v2/community/community-pulse-card";
import { surfacePrimary } from "@/components/v2/today/surface-classes";
import { DopamineMenu } from "@/components/v2/today/dopamine-menu";
import type { DopamineMainTask } from "@/components/v2/today/today-tabs";

type DailyCardProps = {
  initialTasks: TaskRowData[];
  profileId: string;
  mainTask: DopamineMainTask | null;
  onStartFocusSession?: (task?: { id: string; title: string }) => void;
};

export function DailyCard({ initialTasks, profileId, mainTask, onStartFocusSession }: DailyCardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showTaskChat, setShowTaskChat] = useState(false);
  const [showDopamineMenu, setShowDopamineMenu] = useState(false);
  const [addPrefill, setAddPrefill] = useState<{ title: string; domain: string } | null>(null);
  const [startedTasks, setStartedTasks] = useState<Map<string, string>>(() => new Map());
  const [startTaskId, setStartTaskId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const required = tasks.filter((t) => t.is_required);
  const goal = tasks.filter((t) => !t.is_required);
  const hasTasks = required.length > 0 || goal.length > 0;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTasks((prev) => {
      const goalTasks = prev.filter((t) => !t.is_required);
      const requiredTasks = prev.filter((t) => t.is_required);
      const oldIndex = goalTasks.findIndex((t) => t.id === active.id);
      const newIndex = goalTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(goalTasks, oldIndex, newIndex);
      return [...requiredTasks, ...reordered];
    });
  }, []);

  const handleComplete = useCallback(async (id: string) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
    setError(null);

    const res = await fetch(`/api/v2/tasks/${id}/complete`, { method: "POST" });
    if (!res.ok) {
      // Roll back
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not complete task.");
    }
  }, []);

  const startTask = startTaskId ? tasks.find((t) => t.id === startTaskId) : null;

  const handleLog = useCallback(async (title: string, domain: string, notes: string) => {
    setError(null);
    const res = await fetch("/api/v2/tasks/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, domain, notes }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not log session.");
    }
  }, []);

  return (
    <div className="px-4 py-2">
      {showTaskChat && (
        <TaskChatOverlay
          onClose={() => setShowTaskChat(false)}
          onAdd={(task) => {
            setTasks((prev) => [task, ...prev]);
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
          task={startTask}
          onClose={() => setStartTaskId(null)}
          onScheduled={(id, displayTime) => {
            setStartedTasks((prev) => new Map(prev).set(id, displayTime));
          }}
          onScheduleAndFocus={
            onStartFocusSession
              ? () => onStartFocusSession({ id: startTask.id, title: startTask.title })
              : undefined
          }
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
          onAdd={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}

      {hasTasks ? (
        <CommunityPulseCard
          profileId={profileId}
          onAddSuggested={(title, domain) => {
            setAddPrefill({ title, domain });
            setShowAddSheet(true);
          }}
        />
      ) : null}

      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      <div className={`${surfacePrimary} mb-4 p-4`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Today</p>
          <div className="flex items-center gap-2">
            {onStartFocusSession ? (
              <button
                type="button"
                onClick={() => onStartFocusSession()}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
              >
                Start focus session
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowDopamineMenu((v) => !v)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            >
              I&apos;m stuck
            </button>
            {hasTasks ? (
              <button
                type="button"
                onClick={() => {
                  setAddPrefill(null);
                  setShowTaskChat(true);
                }}
                className="flex items-center gap-1 rounded-lg bg-moss px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-moss/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add task
              </button>
            ) : null}
          </div>
        </div>

        {showDopamineMenu ? (
          <DopamineMenu
            mainTask={
              mainTask
                ? {
                    ...mainTask,
                    completed: tasks.find((t) => t.id === mainTask.id)?.completed ?? mainTask.completed,
                  }
                : null
            }
            onCompleteMain={handleComplete}
          />
        ) : null}

      {required.length > 0 && (
        <section className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Required by coach</p>
          {required.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onComplete={handleComplete}
              onStart={setStartTaskId}
              scheduledTime={startedTasks.get(t.id)}
            />
          ))}
        </section>
      )}

      {goal.length > 0 && (
        <section className="mb-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your goals</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={goal.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {goal.map((t) => (
                <DraggableTaskRow
                  key={t.id}
                  task={t}
                  onComplete={handleComplete}
                  onStart={setStartTaskId}
                  scheduledTime={startedTasks.get(t.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </section>
      )}

      {required.length === 0 && goal.length === 0 && (
        <div className="py-6 text-center">
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

      {hasTasks ? <LogSessionForm onLog={handleLog} /> : null}

      {hasTasks ? (
        <div className="mt-4">
          <FindTimePanel />
        </div>
      ) : null}
    </div>
  );
}
