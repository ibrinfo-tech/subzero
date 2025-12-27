import { useDroppable } from "@dnd-kit/core";
import { KanbanTask } from "./KanbanTask";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/lib/utils";
import type { KanbanColumn as KanbanColumnType, Task } from "../types";

export function KanbanColumn({
  column,
  tasks,
}: {
  column: KanbanColumnType;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex flex-col transition-all duration-200 z-50",
        "border-l-4 shadow-md hover:shadow-lg",
        "bg-card/95 backdrop-blur-sm",
        column.color,
        isOver && "ring-2 ring-primary ring-offset-2 bg-accent/10 scale-[1.02]"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-border bg-gradient-to-r from-card/95 to-card/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", column.accentColor)} />
          <h3 className="font-semibold text-sm text-card-foreground tracking-tight">
            {column.title}
          </h3>
        </div>
        <Badge variant="secondary" className="font-medium min-w-[24px] justify-center">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-2.5">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <p className="opacity-50">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => <KanbanTask key={task.id} task={task} />)
        )}
      </div>
    </Card>
  );
}
