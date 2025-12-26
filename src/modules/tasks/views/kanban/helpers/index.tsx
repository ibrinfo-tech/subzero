type TaskStatus = "todo" | "in_progress" | "completed" | "hold" | "nextsprint";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  // add other fields if needed
};

// List all tasks
export async function fetchTasks() {
  const res = await fetch("/api/tasks", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json() as Promise<Task[]>;
}

// Update task
export async function updateTask(taskId: string, data: Partial<{ status: TaskStatus; title: string }>) {
  console.log("status",data);
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  console.log("res ponse eee",res)
  if (!res.ok) throw new Error("Failed to update task");
  return res.json() as Promise<Task>;
}
