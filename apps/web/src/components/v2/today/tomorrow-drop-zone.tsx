"use client";

import { useDroppable } from "@dnd-kit/core";
import { twMerge } from "tailwind-merge";
import { TOMORROW_DROP_ID } from "@/components/v2/today/today-dnd-ids";

type TomorrowDropZoneProps = {
  className?: string;
  compact?: boolean;
};

export function TomorrowDropZone({ className, compact }: TomorrowDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: TOMORROW_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      className={twMerge(
        "rounded-md border border-dashed text-center transition motion-safe:duration-150",
        compact ? "px-3 py-2 text-[11px]" : "px-3 py-3 text-xs",
        isOver
          ? "border-moss bg-moss/10 text-moss"
          : "border-border/80 text-muted-foreground",
        className,
      )}
      aria-label="Drop a task here to plan for tomorrow"
    >
      {isOver ? "Release to plan for tomorrow" : "Drag a task here for tomorrow"}
    </div>
  );
}
