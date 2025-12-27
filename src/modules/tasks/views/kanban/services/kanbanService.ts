import type { Task, TaskStatus } from '../types';

/**
 * Fetch all tasks from the API
 */
export async function fetchTasks(): Promise<{ success: boolean; data: Task[] }> {
  const res = await fetch("/api/tasks", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

/**
 * Update a task's status or other fields
 */
export async function updateTask(
  taskId: string,
  data: Partial<{ status: TaskStatus; title: string }>
): Promise<Task> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

