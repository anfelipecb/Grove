"use client";

import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskRow, type TaskRowData } from "@/components/v2/today/task-row";

type DraggableTaskRowProps = {
  task: TaskRowData;
  onComplete: (id: string) => Promise<void>;
  onStart?: (taskId: string) => void;
  scheduledTime?: string | null;
  onMoveToTomorrow?: (taskId: string) => Promise<void>;
  /** When false, drag only works for drop targets (e.g. tomorrow), not reorder. */
  sortable?: boolean;
};

function SortableTaskRow(props: DraggableTaskRowProps) {
  const { task, onComplete, onStart, scheduledTime, onMoveToTomorrow } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <DragHandle attributes={attributes} listeners={listeners} title={task.title} />
      <div className="min-w-0 flex-1">
        <TaskRow
          task={task}
          onComplete={onComplete}
          onStart={onStart}
          scheduledTime={scheduledTime}
          onMoveToTomorrow={onMoveToTomorrow}
        />
      </div>
    </div>
  );
}

function PlainDraggableTaskRow(props: DraggableTaskRowProps) {
  const { task, onComplete, onStart, scheduledTime, onMoveToTomorrow } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <DragHandle attributes={attributes} listeners={listeners} title={task.title} />
      <div className="min-w-0 flex-1">
        <TaskRow
          task={task}
          onComplete={onComplete}
          onStart={onStart}
          scheduledTime={scheduledTime}
          onMoveToTomorrow={onMoveToTomorrow}
        />
      </div>
    </div>
  );
}

function DragHandle({
  attributes,
  listeners,
  title,
}: {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  title: string;
}) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none p-1 text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      aria-label={`Drag ${title}`}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
}

export function DraggableTaskRow({ sortable = true, ...props }: DraggableTaskRowProps) {
  return sortable ? <SortableTaskRow {...props} /> : <PlainDraggableTaskRow {...props} />;
}
