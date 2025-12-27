export type TaskStatus = 'todo' | 'in_progress' | 'hold' | 'next_sprint' | 'completed';
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
  projectId: string | null;
  createdBy: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  projectId?: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  projectId?: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  customFields?: Record<string, unknown>;
}

export interface TaskListFilters {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  assignedTo?: string | 'all' | 'me';
  projectId?: string | 'all';
  dueDate?: string;
  overdue?: boolean;
}

