export interface ModulePermissionDefinition {
  code: string;
  name: string;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'import'
    | 'export'
    | 'manage_labels'
    | 'duplicate'
    | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const STUDENT_PERMISSIONS: ModulePermissionDefinition[] = [
  {
    code: 'students:create',
    name: 'Create Students',
    action: 'create',
    description: 'Create new students',
  },
  {
    code: 'students:read',
    name: 'Read Students',
    action: 'read',
    description: 'View and read students',
  },
  {
    code: 'students:update',
    name: 'Update Students',
    action: 'update',
    description: 'Edit and update existing students',
  },
  {
    code: 'students:delete',
    name: 'Delete Students',
    action: 'delete',
    description: 'Delete students',
    isDangerous: true,
  },
  {
    code: 'students:import',
    name: 'Import Students',
    action: 'import',
    description: 'Import students from CSV files',
  },
  {
    code: 'students:export',
    name: 'Export Students',
    action: 'export',
    description: 'Export students to CSV files',
  },
  {
    code: 'students:duplicate',
    name: 'Duplicate Students',
    action: 'duplicate',
    description: 'Duplicate existing students',
  },
  {
    code: 'students:manage_labels',
    name: 'Manage Student Labels',
    action: 'manage_labels',
    description: 'Create, edit, and delete student labels',
  },
  {
    code: 'students:*',
    name: 'Full Student Management',
    action: 'manage',
    description: 'Full access to all student operations',
  },
];


