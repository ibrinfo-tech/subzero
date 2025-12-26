import { useDroppable } from "@dnd-kit/core";
import { KanbanTask } from "./KanbanTask";

export function KanbanColumn({
  column,
  tasks,
}: {
  column: { id: string; title: string; color: string };
  tasks: any[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`
        h-full rounded-xl border-t-4 shadow-sm flex flex-col transition z-50
        ${column.color}
        ${isOver ? "bg-transparent" : ""}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tasks.map((task) => (
          <KanbanTask key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
