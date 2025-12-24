// Types for role-related components

import type { Role } from '@/core/lib/db/baseSchema';
import type { CreateRoleInput, UpdateRoleInput } from '@/core/lib/validations/roles';

export interface Permission {
  id: string;
  code: string;
  name: string;
  action: string;
  resource: string | null;
  isDangerous: boolean;
  requiresMfa: boolean;
  description: string | null;
  granted: boolean;
}

export interface ModuleField {
  fieldId: string;
  fieldName: string;
  fieldCode: string;
  fieldLabel: string;
  isVisible?: boolean;
  isEditable?: boolean;
}

export interface FieldPermission {
  fieldId: string;
  fieldName: string;
  visible: boolean;
  editable: boolean;
}

export interface SettingsSubmenuConfig {
  enabled: boolean;
  read: boolean;
  update: boolean;
}

export interface RoleModulePermissions {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  icon: string | null;
  hasAccess?: boolean;
  dataAccess?: 'none' | 'own' | 'team' | 'all';
  permissions: Permission[];
  fields?: ModuleField[];
}

export interface RoleModuleConfig {
  moduleId: string;
  enabled: boolean;
  dataAccess: 'none' | 'own' | 'team' | 'all';
  permissions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    import?: boolean;
    export?: boolean;
    manage_labels?: boolean;
    duplicate?: boolean;
    manage: boolean;
  };
  fieldPermissions: Record<string, FieldPermission>;
  settingsSubmenus?: Record<string, SettingsSubmenuConfig>;
}

export interface EnhancedPermissionAssignmentProps {
  roleId: string;
  roleName: string;
  onBack: () => void;
}

export interface PermissionAssignmentProps {
  roleId: string;
  roleName: string;
  onBack: () => void;
}

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  hasAccess: boolean;
  dataAccess: 'none' | 'own' | 'team' | 'all';
  permissions: Array<{
    permissionId: string;
    permissionName: string;
    permissionCode: string;
    granted: boolean;
  }>;
  totalPermissions?: number;
}

export interface ExpandableRoleTableProps {
  roles: Array<Role & { userCount?: number }>;
  isLoading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onCreate?: () => void;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string) => void;
  onConfigurePermissions?: (role: Role, moduleCode?: string) => void;
}

export interface RoleTableProps {
  roles: Array<Role & { userCount?: number }>;
  isLoading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onCreate?: () => void;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string) => void;
}

export interface RoleListProps {
  onCreateClick?: () => void;
  onEditClick?: (role: Role) => void;
  refreshTrigger?: number;
  onConfigurePermissions?: (role: Role, moduleCode?: string) => void;
}

export interface RoleFormProps {
  initialData?: Role;
  onSubmit: (data: CreateRoleInput | UpdateRoleInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export type RoleFormState = {
  name: string;
  code: string;
  description: string;
  priority: number;
  status: 'active' | 'inactive';
};

