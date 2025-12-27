export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'normal' | 'high' | 'critical';

export interface ProjectRecord {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string | null;
  endDate: string | null;
  ownerId: string | null;
  teamMemberIds: string[];
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  progress: number;
  labelIds: string[];
  customFields: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string | null;
  endDate?: string | null;
  ownerId?: string | null;
  teamMemberIds?: string[];
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  progress?: number;
  labelIds?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string | null;
  endDate?: string | null;
  ownerId?: string | null;
  teamMemberIds?: string[];
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  progress?: number;
  labelIds?: string[];
  customFields?: Record<string, unknown>;
}

export interface ProjectListFilters {
  search?: string;
  status?: ProjectStatus | 'all';
  priority?: ProjectPriority | 'all';
  ownerId?: string | 'all' | 'me';
  myProjects?: boolean;
  archived?: boolean;
  startDate?: string;
  endDate?: string;
}

