"use client";

import { useEffect, useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTask } from "./KanbanTask";
import { fetchTasks, updateTask } from "../services/kanbanService";
import { KANBAN_COLUMNS } from "../constants";
import { sortTasks, getNextSortState } from "../utils/sorting";
import type { Task, TaskStatus, SortState } from "../types";
import type { TaskListFilters } from "../../../types";

interface KanbanBoardProps {
  filters?: TaskListFilters;
}

export default function KanbanBoard({ filters }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sortStates, setSortStates] = useState<Record<TaskStatus, SortState>>({
    todo: 'dueDate_asc',
    in_progress: 'dueDate_asc',
    completed: 'dueDate_asc',
    hold: 'dueDate_asc',
    next_sprint: 'dueDate_asc',
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTasks(filters);
        if (data?.success) {
          setTasks(data?.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [filters]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error(err);
      // Optional: revert UI on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: activeTask?.status! } : t))
      );
    }
  };

  const handleSortClick = (columnId: TaskStatus) => {
    setSortStates((prev) => ({
      ...prev,
      [columnId]: getNextSortState(prev[columnId]),
    }));
  };

  // Memoize sorted tasks per column
  const sortedTasksByColumn = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      completed: [],
      hold: [],
      next_sprint: [],
    };

    KANBAN_COLUMNS.forEach((col) => {
      const columnTasks = tasks.filter((t) => t.status === col.id);
      const sortDirection = sortStates[col.id];
      result[col.id] = sortTasks(columnTasks, sortDirection);
    });

    return result;
  }, [tasks, sortStates]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-[calc(100vh-8rem)] overflow-y-auto overflow-x-auto bg-background">
        <div className="flex gap-4 p-4 pb-6 min-h-full">
          {KANBAN_COLUMNS.map((col) => (
            <div key={col.id} className="flex-1 min-w-[280px] max-w-full flex-shrink-0">
              <KanbanColumn
                column={col}
                tasks={sortedTasksByColumn[col.id]}
                sortState={sortStates[col.id]}
                onSortClick={() => handleSortClick(col.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <DragOverlay className="z-50">
        {activeTask ? (
          <div className="rotate-3 scale-105 opacity-90">
            <KanbanTask task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

