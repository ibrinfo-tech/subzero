import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar } from "lucide-react";
import { Card } from "@/core/components/ui/card";
import { cn } from "@/core/lib/utils";
import type { Task } from "../types";

const isOverdue = (dueDate: string | null, status: string) => {
  if (!dueDate || status === 'completed') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export function KanbanTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing",
        "transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        "bg-card border-border",
        "group",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-xl"
      )}
    >
      <div className="flex gap-2.5">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug text-card-foreground">
            {task.title}
          </p>
          {task.dueDate && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs",
              overdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              <Calendar className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                overdue && "text-destructive"
              )} />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {overdue && (
                <span className="ml-1 text-destructive font-semibold">• Overdue</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
