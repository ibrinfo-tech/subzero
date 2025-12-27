// Permission definitions for the Projects module.

export interface ProjectPermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'archive' | 'manage_team' | 'export' | 'import' | 'duplicate' | 'manage_labels' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const PROJECT_PERMISSIONS: ProjectPermissionDefinition[] = [
  {
    code: 'projects:create',
    name: 'Create Projects',
    action: 'create',
    description: 'Create new projects',
  },
  {
    code: 'projects:read',
    name: 'View Projects',
    action: 'read',
    description: 'View and read projects',
  },
  {
    code: 'projects:update',
    name: 'Update Projects',
    action: 'update',
    description: 'Edit and update existing projects',
  },
  {
    code: 'projects:delete',
    name: 'Delete Projects',
    action: 'delete',
    description: 'Delete projects',
    isDangerous: true,
  },
  {
    code: 'projects:archive',
    name: 'Archive Projects',
    action: 'archive',
    description: 'Archive and unarchive projects',
  },
  {
    code: 'projects:manage_team',
    name: 'Manage Project Team',
    action: 'manage_team',
    description: 'Add or remove team members from projects',
  },
  {
    code: 'projects:export',
    name: 'Export Projects',
    action: 'export',
    description: 'Export projects to CSV',
  },
  {
    code: 'projects:import',
    name: 'Import Projects',
    action: 'import',
    description: 'Import projects from CSV',
  },
  {
    code: 'projects:duplicate',
    name: 'Duplicate Projects',
    action: 'duplicate',
    description: 'Duplicate existing projects',
  },
  {
    code: 'projects:manage_labels',
    name: 'Manage Project Labels',
    action: 'manage_labels',
    description: 'Create and manage project labels',
  },
  {
    code: 'projects:*',
    name: 'Full Project Management',
    action: 'manage',
    description: 'Full access to all project operations',
    isDangerous: true,
  },
];

