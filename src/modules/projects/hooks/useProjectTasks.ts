import { useEffect, useState } from 'react';
import type { Task } from '@/modules/tasks/schemas/tasksSchema';
import type { CreateTaskInput, UpdateTaskInput } from '@/modules/tasks/schemas/tasksValidation';

type TaskInput = CreateTaskInput | UpdateTaskInput;

export function useProjectTasks(projectId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      const json = await res.json();
      if (res.ok) {
        setTasks(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const saveTask = async (input: TaskInput & { id?: string }) => {
    if (!projectId) return;
    setSaving(true);
    try {
      const method = input.id ? 'PATCH' : 'POST';
      const url = input.id
        ? `/api/projects/${projectId}/tasks/${input.id}`
        : `/api/projects/${projectId}/tasks`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save task');
      }
      await fetchTasks();
      return json.data as Task;
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!projectId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete task');
      }
      await fetchTasks();
    } finally {
      setSaving(false);
    }
  };

  return {
    tasks,
    loading,
    saving,
    fetchTasks,
    saveTask,
    deleteTask,
  };
}

