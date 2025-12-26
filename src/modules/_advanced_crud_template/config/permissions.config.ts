/**
 * Advanced CRUD Module Permissions Configuration
 */

export interface AdvancedCrudModulePermissionDefinition {
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
    | 'manage';
  description: string;
  isDangerous?: boolean;
  requiresMfa?: boolean;
}

export const ADVANCED_CRUD_PERMISSIONS: AdvancedCrudModulePermissionDefinition[] = [
  // Basic CRUD permissions
  {
    code: 'advanced_crud:create',
    name: 'Create Advanced CRUD Records',
    action: 'create',
    description: 'Create new records in this module',
  },
  {
    code: 'advanced_crud:read',
    name: 'Read Advanced CRUD Records',
    action: 'read',
    description: 'View and read records in this module',
  },
  {
    code: 'advanced_crud:update',
    name: 'Update Advanced CRUD Records',
    action: 'update',
    description: 'Edit and update existing records in this module',
  },
  {
    code: 'advanced_crud:delete',
    name: 'Delete Advanced CRUD Records',
    action: 'delete',
    description: 'Delete records in this module',
    isDangerous: true,
  },
  // Import/Export permissions
  {
    code: 'advanced_crud:import',
    name: 'Import Advanced CRUD Records',
    action: 'import',
    description: 'Import records from CSV/Excel files',
  },
  {
    code: 'advanced_crud:export',
    name: 'Export Advanced CRUD Records',
    action: 'export',
    description: 'Export records to CSV/Excel files',
  },
  // Full management permission (wildcard)
  {
    code: 'advanced_crud:*',
    name: 'Full Advanced CRUD Module Management',
    action: 'manage',
    description: 'Full access to all operations in this module',
  },
];


