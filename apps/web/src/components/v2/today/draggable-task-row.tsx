"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskRow, type TaskRowData } from "@/components/v2/today/task-row";

type DraggableTaskRowProps = {
  task: TaskRowData;
  onComplete: (id: string) => Promise<void>;
  onStart?: (taskId: string) => void;
  scheduledTime?: string;
};

export function DraggableTaskRow({ task, onComplete, onStart, scheduledTime }: DraggableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground p-1">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1">
        <TaskRow task={task} onComplete={onComplete} onStart={onStart} scheduledTime={scheduledTime} />
      </div>
    </div>
  );
}
