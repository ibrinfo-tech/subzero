import { db } from '@/core/lib/db';
import { 
  roleModuleAccess, 
  roleModulePermissions, 
  moduleFields, 
  roleFieldPermissions 
} from '@/core/lib/db/permissionSchema';
import { roles, modules, permissions, rolePermissions as legacyRolePermissions } from '@/core/lib/db/baseSchema';
import { eq, and } from 'drizzle-orm';

export type DataAccessLevel = 'none' | 'own' | 'team' | 'all';

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  moduleIcon?: string | null;
  hasAccess: boolean;
  dataAccess: DataAccessLevel;
  permissions: Array<{
    permissionId: string;
    permissionName: string;
    permissionCode: string;
    granted: boolean;
  }>;
  fields: Array<{
    fieldId: string;
    fieldName: string;
    fieldCode: string;
    fieldLabel: string;
    isVisible: boolean;
    isEditable: boolean;
  }>;
}

export interface RolePermissionsData {
  roleId: string;
  modules: ModulePermission[];
}

/**
 * Get all permissions for a role, organized by module
 * Super Admin automatically gets access to all modules and all permissions
 */
export async function getRolePermissions(roleId: string): Promise<RolePermissionsData> {
  // Check if this is Super Admin role
  const role = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  const isSuperAdmin = role.length > 0 && role[0].code === 'SUPER_ADMIN';

  // Get all modules
  const allModules = await db
    .select()
    .from(modules)
    .where(eq(modules.isActive, true))
    .orderBy(modules.sortOrder);

  // Get all permissions (needed for Super Admin and to build full matrix)
  const allPermissions = await db
    .select()
    .from(permissions)
    .where(eq(permissions.isActive, true));

  // Get legacy role permissions (role_permissions) for backward compatibility
  const legacyPermissions = await db
    .select()
    .from(legacyRolePermissions)
    .where(eq(legacyRolePermissions.roleId, roleId));

  const legacyPermissionIds = new Set(legacyPermissions.map((p) => p.permissionId));

  // Get module access for this role
  const moduleAccess = await db
    .select()
    .from(roleModuleAccess)
    .where(eq(roleModuleAccess.roleId, roleId));

  // Get module permissions for this role
  const modulePermissions = await db
    .select({
      roleModulePermission: roleModulePermissions,
      permission: permissions,
    })
    .from(roleModulePermissions)
    .innerJoin(permissions, eq(roleModulePermissions.permissionId, permissions.id))
    .where(eq(roleModulePermissions.roleId, roleId));

  // Get module fields
  const allFields = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.isActive, true))
    .orderBy(moduleFields.sortOrder);

  // Get field permissions for this role
  const fieldPermissions = await db
    .select()
    .from(roleFieldPermissions)
    .where(eq(roleFieldPermissions.roleId, roleId));

  // Build the result structure (exclude profile module - it should be viewable and updatable by every user for their own profile)
  const modulesData: ModulePermission[] = allModules
    .filter((module) => module.code.toLowerCase() !== 'profile')
    .map((module) => {
    const access = moduleAccess.find((ma) => ma.moduleId === module.id);
    const modulePerms = modulePermissions.filter((mp) => mp.roleModulePermission.moduleId === module.id);
    const moduleFieldsList = allFields.filter((f) => f.moduleId === module.id);
    const fieldPerms = fieldPermissions.filter((fp) => fp.moduleId === module.id);

    // For Super Admin: grant access to all modules and all permissions/fields
    if (isSuperAdmin) {
      // Get all permissions for this module
      const moduleAllPermissions = allPermissions.filter((p) => p.module === module.code);
      
      return {
        moduleId: module.id,
        moduleName: module.name,
        moduleCode: module.code,
        moduleIcon: module.icon,
        hasAccess: true, // Super Admin has access to all modules
        dataAccess: 'all' as DataAccessLevel, // Super Admin can access all data
        permissions: moduleAllPermissions.map((p) => ({
          permissionId: p.id,
          permissionName: p.name,
          permissionCode: p.code,
          granted: true, // Super Admin has all permissions granted
        })),
        fields: moduleFieldsList.map((field) => ({
          fieldId: field.id,
          fieldName: field.name,
          fieldCode: field.code,
          fieldLabel: field.label || field.name,
          isVisible: true, // Super Admin can see all fields
          isEditable: true, // Super Admin can edit all fields
        })),
      };
    }

    // For other roles: use actual permissions from database
    // NOTE: We do NOT use legacy permissions as fallback - permissions must be explicitly set
    // in the new role_module_access and role_module_permissions tables
    const moduleAllPermissions = allPermissions.filter((p) => p.module === module.code.toLowerCase());

    return {
      moduleId: module.id,
      moduleName: module.name,
      moduleCode: module.code,
      moduleIcon: module.icon,
      // Only grant access if explicitly set in role_module_access table
      hasAccess: access?.hasAccess ?? false,
      // Only set data access if explicitly configured, otherwise 'none'
      dataAccess: (access?.dataAccess as DataAccessLevel) || (access?.hasAccess ? 'team' : 'none'),
      permissions: moduleAllPermissions.map((permission) => {
        const modulePerm = modulePerms.find((mp) => mp.permission.id === permission.id);
        // Only grant permission if explicitly set in role_module_permissions table
        // Do NOT fall back to legacy permissions
        return {
          permissionId: permission.id,
          permissionName: permission.name,
          permissionCode: permission.code,
          granted: modulePerm?.roleModulePermission.granted ?? false,
        };
      }),
      fields: moduleFieldsList.map((field) => {
        const fieldPerm = fieldPerms.find((fp) => fp.fieldId === field.id);
        return {
          fieldId: field.id,
          fieldName: field.name,
          fieldCode: field.code,
          fieldLabel: field.label || field.name,
          isVisible: fieldPerm?.isVisible || false,
          isEditable: fieldPerm?.isEditable || false,
        };
      }),
    };
  });

  return {
    roleId,
    modules: modulesData,
  };
}

/**
 * Get permissions for a specific role and module
 */
export async function getRoleModulePermissions(
  roleId: string,
  moduleId: string
): Promise<ModulePermission | null> {
  const rolePerms = await getRolePermissions(roleId);
  return rolePerms.modules.find((m) => m.moduleId === moduleId) || null;
}

/**
 * Update role module access and permissions
 */
export async function updateRoleModulePermissions(
  roleId: string,
  moduleId: string,
  data: {
    hasAccess: boolean;
    dataAccess: DataAccessLevel;
    permissions: Array<{
      permissionId: string;
      granted: boolean;
    }>;
    fields: Array<{
      fieldId: string;
      isVisible: boolean;
      isEditable: boolean;
    }>;
  },
  updatedBy: string
): Promise<void> {
  // Debug: log writes for Projects module only
  try {
    const moduleRow = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);
    const moduleCodeLower = moduleRow?.[0]?.code?.toLowerCase?.();
    if (moduleCodeLower === 'projects') {
      // Also fetch how many active permissions exist for this module in DB
      const availablePerms = await db
        .select()
        .from(permissions)
        .where(and(eq(permissions.module, moduleCodeLower), eq(permissions.isActive, true)));

      console.log('[RBAC Save][Projects] updateRoleModulePermissions', {
        roleId,
        moduleId,
        moduleCode: moduleRow?.[0]?.code,
        hasAccess: data.hasAccess,
        dataAccess: data.dataAccess,
        permissions: data.permissions,
        fields: data.fields,
        availablePermissionsInDb: availablePerms.length,
        availablePermissionCodes: availablePerms.map((p) => p.code),
      });
    }
  } catch (e) {
    console.warn('[RBAC Save] failed to log module write', e);
  }

  // Update or create module access
  const existingAccess = await db
    .select()
    .from(roleModuleAccess)
    .where(and(
      eq(roleModuleAccess.roleId, roleId),
      eq(roleModuleAccess.moduleId, moduleId)
    ))
    .limit(1);

  if (existingAccess.length > 0) {
    await db
      .update(roleModuleAccess)
      .set({
        hasAccess: data.hasAccess,
        dataAccess: data.dataAccess,
        updatedAt: new Date(),
        updatedBy,
      })
      .where(and(
        eq(roleModuleAccess.roleId, roleId),
        eq(roleModuleAccess.moduleId, moduleId)
      ));
  } else {
    await db.insert(roleModuleAccess).values({
      roleId,
      moduleId,
      hasAccess: data.hasAccess,
      dataAccess: data.dataAccess,
      createdBy: updatedBy,
      updatedBy,
    });
  }

  // Update permissions
  for (const perm of data.permissions) {
    if (!perm.permissionId) {
      console.warn('Skipping permission with missing permissionId');
      continue;
    }
    
    const existing = await db
      .select()
      .from(roleModulePermissions)
      .where(and(
        eq(roleModulePermissions.roleId, roleId),
        eq(roleModulePermissions.moduleId, moduleId),
        eq(roleModulePermissions.permissionId, perm.permissionId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(roleModulePermissions)
        .set({
          granted: perm.granted,
          updatedAt: new Date(),
          updatedBy,
        })
        .where(and(
          eq(roleModulePermissions.roleId, roleId),
          eq(roleModulePermissions.moduleId, moduleId),
          eq(roleModulePermissions.permissionId, perm.permissionId)
        ));
    } else {
      await db.insert(roleModulePermissions).values({
        roleId,
        moduleId,
        permissionId: perm.permissionId,
        granted: perm.granted,
        createdBy: updatedBy,
        updatedBy,
      });
    }
  }

  // Update field permissions
  for (const field of data.fields) {
    if (!field.fieldId) {
      console.warn('Skipping field with missing fieldId');
      continue;
    }
    
    const existing = await db
      .select()
      .from(roleFieldPermissions)
      .where(and(
        eq(roleFieldPermissions.roleId, roleId),
        eq(roleFieldPermissions.moduleId, moduleId),
        eq(roleFieldPermissions.fieldId, field.fieldId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(roleFieldPermissions)
        .set({
          isVisible: field.isVisible,
          isEditable: field.isEditable,
          updatedAt: new Date(),
          updatedBy,
        })
        .where(and(
          eq(roleFieldPermissions.roleId, roleId),
          eq(roleFieldPermissions.moduleId, moduleId),
          eq(roleFieldPermissions.fieldId, field.fieldId)
        ));
    } else {
      await db.insert(roleFieldPermissions).values({
        roleId,
        moduleId,
        fieldId: field.fieldId,
        isVisible: field.isVisible,
        isEditable: field.isEditable,
        createdBy: updatedBy,
        updatedBy,
      });
    }
  }
}

/**
 * Get all permissions for a module
 */
export async function getModulePermissions(moduleCode: string) {
  return await db
    .select()
    .from(permissions)
    .where(and(
      eq(permissions.module, moduleCode),
      eq(permissions.isActive, true)
    ));
}

/**
 * Get all fields for a module
 */
export async function getModuleFields(moduleId: string) {
  return await db
    .select()
    .from(moduleFields)
    .where(and(
      eq(moduleFields.moduleId, moduleId),
      eq(moduleFields.isActive, true)
    ))
    .orderBy(moduleFields.sortOrder);
}

