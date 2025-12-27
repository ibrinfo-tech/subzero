import { useDroppable } from "@dnd-kit/core";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { KanbanTask } from "./KanbanTask";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "./Tooltip";
import { cn } from "@/core/lib/utils";
import type { KanbanColumn as KanbanColumnType, Task, SortState } from "../types";

export function KanbanColumn({
  column,
  tasks,
  sortState,
  onSortClick,
}: {
  column: KanbanColumnType;
  tasks: Task[];
  sortState?: SortState;
  onSortClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const getSortIcon = () => {
    if (!sortState) return <ArrowUpDown className="w-3.5 h-3.5" />;
    if (sortState.endsWith('_asc')) return <ArrowUp className="w-3.5 h-3.5" />;
    return <ArrowDown className="w-3.5 h-3.5" />;
  };

  const getSortTooltip = () => {
    if (!sortState) return "Click to sort: Due Date (Ascending)";
    if (sortState === 'dueDate_asc') return "Sorted: Due Date (Ascending)";
    if (sortState === 'dueDate_desc') return "Sorted: Due Date (Descending)";
    if (sortState === 'title_asc') return "Sorted: Title (Ascending)";
    if (sortState === 'title_desc') return "Sorted: Title (Descending)";
    return "";
  };

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
        <Tooltip content={getSortTooltip()} side="top">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSortClick?.();
            }}
            className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity cursor-pointer group text-left"
            type="button"
          >
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", column.accentColor)} />
            <h3 className="font-semibold text-sm text-card-foreground tracking-tight">
              {column.title}
            </h3>
            {onSortClick && (
              <span
                className={cn(
                  "text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                  sortState && "opacity-100 text-primary"
                )}
              >
                {getSortIcon()}
              </span>
            )}
          </button>
        </Tooltip>
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
