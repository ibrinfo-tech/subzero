"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTask } from "./KanbanTask";
import { fetchTasks, updateTask } from "../services/kanbanService";
import { KANBAN_COLUMNS } from "../constants";
import type { Task, TaskStatus } from "../types";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTasks();
        if (data?.success) {
          setTasks(data?.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

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

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto h-[calc(100vh-8rem)] p-4 pb-6 bg-background">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.id} className="flex-1 min-w-[280px] max-w-full h-full flex-shrink-0">
            <KanbanColumn
              column={col}
              tasks={tasks?.filter((t) => t?.status === col?.id)}
            />
          </div>
        ))}
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

