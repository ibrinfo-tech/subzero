import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export function KanbanTask({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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
      className=" border rounded p-3 shadow-sm cursor-grab active:cursor-grabbing"
    >
      {task.title}
    </div>
  );
}
