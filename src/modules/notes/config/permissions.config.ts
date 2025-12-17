export interface NotesPermissionDefinition {
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

export const NOTES_PERMISSIONS: NotesPermissionDefinition[] = [
  {
    code: 'notes:create',
    name: 'Create Notes',
    action: 'create',
    description: 'Create new notes',
  },
  {
    code: 'notes:read',
    name: 'Read Notes',
    action: 'read',
    description: 'View and read notes',
  },
  {
    code: 'notes:update',
    name: 'Update Notes',
    action: 'update',
    description: 'Edit and update existing notes',
  },
  {
    code: 'notes:delete',
    name: 'Delete Notes',
    action: 'delete',
    description: 'Delete notes',
    isDangerous: true,
  },
  {
    code: 'notes:import',
    name: 'Import Notes',
    action: 'import',
    description: 'Import notes from CSV/Excel files',
  },
  {
    code: 'notes:export',
    name: 'Export Notes',
    action: 'export',
    description: 'Export notes to CSV/Excel files',
  },
  {
    code: 'notes:manage_labels',
    name: 'Manage Note Labels',
    action: 'manage_labels',
    description: 'Create, edit, and delete note labels',
  },
  {
    code: 'notes:duplicate',
    name: 'Duplicate Notes',
    action: 'duplicate',
    description: 'Duplicate an existing note',
  },
  {
    code: 'notes:*',
    name: 'Full Notes Management',
    action: 'manage',
    description: 'Full access to all note operations',
  },
];


