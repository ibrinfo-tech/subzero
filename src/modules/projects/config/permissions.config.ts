/**
 * Projects Module Permissions Configuration
 * 
 * This file defines all permissions for the projects module.
 * 
 * To create a similar module, copy this file and update:
 * 1. Module name (replace 'projects' with your module name)
 * 2. Permission codes and names
 * 3. Action types
 */

export interface ModulePermissionDefinition {
  code: string;
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'import' | 'export' | 'manage_labels' | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const PROJECT_PERMISSIONS: ModulePermissionDefinition[] = [
  // Basic CRUD permissions
  {
    code: 'projects:create',
    name: 'Create Projects',
    action: 'create',
    description: 'Create new projects',
  },
  {
    code: 'projects:read',
    name: 'Read Projects',
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
  // Import/Export permissions
  {
    code: 'projects:import',
    name: 'Import Projects',
    action: 'import',
    description: 'Import projects from CSV/Excel files',
  },
  {
    code: 'projects:export',
    name: 'Export Projects',
    action: 'export',
    description: 'Export projects to CSV/Excel files',
  },
  // Duplicate permission
  {
    code: 'projects:duplicate',
    name: 'Duplicate Projects',
    action: 'duplicate',
    description: 'Duplicate an existing project',
  },
  // Labels management permission
  {
    code: 'projects:manage_labels',
    name: 'Manage Project Labels',
    action: 'manage_labels',
    description: 'Create, edit, and delete project labels',
  },
  // Full management permission (wildcard)
  {
    code: 'projects:*',
    name: 'Full Project Management',
    action: 'manage',
    description: 'Full access to all project operations',
  },
];

/**
 * Get permission code by action
 */
export function getPermissionCode(action: ModulePermissionDefinition['action']): string {
  const permission = PROJECT_PERMISSIONS.find(p => p.action === action);
  return permission?.code || '';
}

/**
 * Check if action requires dangerous permission
 */
export function isDangerousAction(action: ModulePermissionDefinition['action']): boolean {
  const permission = PROJECT_PERMISSIONS.find(p => p.action === action);
  return permission?.isDangerous || false;
}

