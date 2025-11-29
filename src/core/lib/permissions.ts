import { db } from './db';
import { 
  users, 
  roles, 
  permissions, 
  rolePermissions, 
  modules 
} from './db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Get all permissions for a user through their role
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await db
    .select({ code: permissions.code })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(users.id, userId),
        isNull(users.deletedAt),
        eq(users.status, 'active'),
        isNull(roles.deletedAt),
        eq(roles.status, 'active'),
        isNull(permissions.deletedAt),
        eq(permissions.isActive, true)
      )
    );

  return result.map((r) => r.code);
}

/**
 * Check if user has a specific permission
 * SUPER_ADMIN always returns true (bypasses all permission checks)
 */
export async function userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
  // Check if user is SUPER_ADMIN first
  const userRole = await getUserRole(userId);
  if (userRole && userRole.code === 'SUPER_ADMIN') {
    return true; // SUPER_ADMIN has all permissions
  }
  
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.includes(permissionCode);
}

/**
 * Check if user has any of the specified permissions
 * SUPER_ADMIN always returns true (bypasses all permission checks)
 */
export async function userHasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
  // Check if user is SUPER_ADMIN first
  const userRole = await getUserRole(userId);
  if (userRole && userRole.code === 'SUPER_ADMIN') {
    return true; // SUPER_ADMIN has all permissions
  }
  
  const userPermissions = await getUserPermissions(userId);
  return permissionCodes.some((code) => userPermissions.includes(code));
}

/**
 * Check if user has all of the specified permissions
 * SUPER_ADMIN always returns true (bypasses all permission checks)
 */
export async function userHasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
  // Check if user is SUPER_ADMIN first
  const userRole = await getUserRole(userId);
  if (userRole && userRole.code === 'SUPER_ADMIN') {
    return true; // SUPER_ADMIN has all permissions
  }
  
  const userPermissions = await getUserPermissions(userId);
  return permissionCodes.every((code) => userPermissions.includes(code));
}

/**
 * Get user's role
 */
export async function getUserRole(userId: string): Promise<{ id: string; name: string; code: string } | null> {
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(
      and(
        eq(users.id, userId),
        isNull(users.deletedAt),
        eq(users.status, 'active'),
        isNull(roles.deletedAt),
        eq(roles.status, 'active')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all roles for a user (for backward compatibility, returns array with single role)
 */
export async function getUserRoles(userId: string): Promise<Array<{ id: string; name: string; code: string }>> {
  const role = await getUserRole(userId);
  return role ? [role] : [];
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(userId: string, roleCode: string): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.some((role) => role.code === roleCode);
}

/**
 * Get user permissions with module information
 */
export async function getUserPermissionsWithModules(userId: string): Promise<Array<{
  permissionCode: string;
  permissionName: string;
  moduleCode: string;
  moduleName: string;
}>> {
  const result = await db
    .select({
      permissionCode: permissions.code,
      permissionName: permissions.name,
      moduleCode: modules.code,
      moduleName: modules.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(modules, eq(permissions.moduleId, modules.id))
    .where(
      and(
        eq(users.id, userId),
        isNull(users.deletedAt),
        eq(users.status, 'active'),
        isNull(roles.deletedAt),
        eq(roles.status, 'active'),
        isNull(permissions.deletedAt),
        eq(permissions.isActive, true),
        eq(modules.isActive, true)
      )
    );

  return result;
}
