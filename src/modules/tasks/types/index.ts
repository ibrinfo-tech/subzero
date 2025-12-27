export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TaskRecord {
  id: string;
  tenantId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignedTo: string | null;
  createdBy: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sectionId: string | null; // REQUIRED for new tasks, nullable for backward compatibility
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  customFields?: Record<string, unknown>;
  sectionId: string; // REQUIRED - every task must belong to a section
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  customFields?: Record<string, unknown>;
}

export interface TaskListFilters {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  assignedTo?: string | 'all' | 'me';
  dueDate?: string;
  overdue?: boolean;
}

// ---------- Section ----------
export interface TaskSection {
  id: string;
  title: string;
  order: number;
  // tasks: TaskRecord[];
}
