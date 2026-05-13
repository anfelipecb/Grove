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

type DailyCardProps = {
  initialTasks: TaskRowData[];
};

export function DailyCard({ initialTasks }: DailyCardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const required = tasks.filter((t) => t.is_required);
  const goal = tasks.filter((t) => !t.is_required);

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
      {showAddSheet && (
        <AddTaskSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}

      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today</p>
        <button
          onClick={() => setShowAddSheet(true)}
          className="flex items-center gap-1 rounded-lg border border-moss/40 px-2.5 py-1 text-xs font-medium text-moss transition-colors hover:bg-moss/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      </div>

      {required.length > 0 && (
        <section className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Required by coach</p>
          {required.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </section>
      )}

      {goal.length > 0 && (
        <section className="mb-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your goals</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={goal.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {goal.map((t) => (
                <DraggableTaskRow key={t.id} task={t} onComplete={handleComplete} />
              ))}
            </SortableContext>
          </DndContext>
        </section>
      )}

      {required.length === 0 && goal.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm font-medium text-foreground">No tasks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a task above, or let Coach set up your goals.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
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

      <LogSessionForm onLog={handleLog} />
    </div>
  );
}
