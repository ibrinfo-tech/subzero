import type { Task, TaskStatus } from '../types';
import type { TaskListFilters } from '../../../types';

/**
 * Fetch all tasks from the API with optional filters
 */
export async function fetchTasks(filters?: TaskListFilters): Promise<{ success: boolean; data: Task[] }> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.search) params.set('search', filters.search);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'me') {
        params.set('assignedTo', 'me');
      } else {
        params.set('assignedTo', filters.assignedTo);
      }
    }
    if (filters.overdue) params.set('overdue', 'true');
  }

  const query = params.toString();
  const url = query ? `/api/tasks?${query}` : '/api/tasks';
  
  const res = await fetch(url, { cache: "no-store" });
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

