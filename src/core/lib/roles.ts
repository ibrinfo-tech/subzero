import { db } from './db';
import { roles, MULTI_TENANT_ENABLED } from './db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Get the default role for new registrations (is_default = true)
 */
export async function getDefaultUserRole(tenantId?: string): Promise<{ id: string; name: string; code: string } | null> {
  const whereConditions = [
    eq(roles.isDefault, true),
    eq(roles.status, 'active')
  ];

  // Only check tenantId if multi-tenancy is enabled and tenantId column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in roles) {
    if (tenantId) {
      whereConditions.push(eq(roles.tenantId, tenantId));
    } else {
      whereConditions.push(isNull(roles.tenantId));
    }
  }

  const result = await db
    .select({ 
      id: roles.id,
      name: roles.name,
      code: roles.code,
    })
    .from(roles)
    .where(and(...whereConditions))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get role by code
 */
export async function getRoleByCode(code: string, tenantId?: string): Promise<{ id: string; name: string; code: string } | null> {
  const whereConditions = [
    eq(roles.code, code),
    eq(roles.status, 'active')
  ];

  // Only check tenantId if multi-tenancy is enabled and tenantId column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in roles) {
    if (tenantId) {
      whereConditions.push(eq(roles.tenantId, tenantId));
    } else {
      whereConditions.push(isNull(roles.tenantId));
    }
  }

  const result = await db
    .select({ 
      id: roles.id,
      name: roles.name,
      code: roles.code,
    })
    .from(roles)
    .where(and(...whereConditions))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string): Promise<{ id: string; name: string; code: string; tenantId: string | null; isSystem: boolean } | null> {
  // Only include tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in roles) {
    const result = await db
      .select({
        id: roles.id,
        name: roles.name,
        code: roles.code,
        tenantId: roles.tenantId,
        isSystem: roles.isSystem,
      })
      .from(roles)
      .where(
        and(
          eq(roles.id, id),
          eq(roles.status, 'active')
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } else {
    const result = await db
      .select({
        id: roles.id,
        name: roles.name,
        code: roles.code,
        isSystem: roles.isSystem,
      })
      .from(roles)
      .where(
        and(
          eq(roles.id, id),
          eq(roles.status, 'active')
        )
      )
      .limit(1);

    return result.length > 0 ? { ...result[0], tenantId: null } : null;
  }
}

/**
 * Check if a role is a system role
 */
export async function isSystemRole(roleId: string): Promise<boolean> {
  const role = await getRoleById(roleId);
  return role ? role.isSystem : false;
}

/**
 * Get all system roles (global roles that apply across tenants)
 */
export async function getSystemRoles(): Promise<Array<{ id: string; name: string; code: string; priority: number }>> {
  const whereConditions = [
    eq(roles.isSystem, true),
    eq(roles.status, 'active')
  ];

  // Only check tenantId if multi-tenancy is enabled and tenantId column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in roles) {
    whereConditions.push(isNull(roles.tenantId));
  }

  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
      priority: roles.priority,
    })
    .from(roles)
    .where(and(...whereConditions))
    .orderBy(roles.priority);

  return result;
}
