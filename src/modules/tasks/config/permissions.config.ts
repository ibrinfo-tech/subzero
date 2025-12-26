// Permission definitions for the Tasks module.

export interface TaskPermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'assign' | 'complete' | 'export' | 'import' | 'duplicate' | 'manage_labels' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const TASK_PERMISSIONS: TaskPermissionDefinition[] = [
  {
    code: 'tasks:create',
    name: 'Create Tasks',
    action: 'create',
    description: 'Create new tasks',
  },
  {
    code: 'tasks:read',
    name: 'View Tasks',
    action: 'read',
    description: 'View and read tasks',
  },
  {
    code: 'tasks:update',
    name: 'Update Tasks',
    action: 'update',
    description: 'Edit and update existing tasks',
  },
  {
    code: 'tasks:delete',
    name: 'Delete Tasks',
    action: 'delete',
    description: 'Delete tasks',
    isDangerous: true,
  },
  {
    code: 'tasks:assign',
    name: 'Assign Tasks',
    action: 'assign',
    description: 'Assign tasks to users',
  },
  {
    code: 'tasks:complete',
    name: 'Complete Tasks',
    action: 'complete',
    description: 'Mark tasks as completed',
  },
  {
    code: 'tasks:export',
    name: 'Export Tasks',
    action: 'export',
    description: 'Export tasks to CSV',
  },
  {
    code: 'tasks:import',
    name: 'Import Tasks',
    action: 'import',
    description: 'Import tasks from CSV',
  },
  {
    code: 'tasks:duplicate',
    name: 'Duplicate Tasks',
    action: 'duplicate',
    description: 'Duplicate existing tasks',
  },
  {
    code: 'tasks:manage_labels',
    name: 'Manage Task Labels',
    action: 'manage_labels',
    description: 'Create and manage task labels',
  },
  {
    code: 'tasks:*',
    name: 'Full Task Management',
    action: 'manage',
    description: 'Full access to all task operations',
    isDangerous: true,
  },
];

