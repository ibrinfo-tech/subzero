export type TaskStatus = "todo" | "in_progress" | "completed" | "hold" | "next_sprint";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  // add other fields if needed
};

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color?: string;
  accentColor?: string;
}

export type SortState = 'dueDate_asc' | 'dueDate_desc' | 'title_asc' | 'title_desc' | null;

