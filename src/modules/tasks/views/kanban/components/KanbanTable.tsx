import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export function KanbanTask({ task }: { task: any }) {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
         border rounded-lg p-3 shadow-sm
        hover:shadow-md transition
        cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5" />
        <p className="text-sm font-medium leading-snug">{task.title}</p>
      </div>
    </div>
  );
}
