import { db } from '@/core/lib/db';
import { roles, users } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, isNull, desc, count } from 'drizzle-orm';
import type { Role, NewRole } from '@/core/lib/db/baseSchema';

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  priority?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateRoleInput {
  name?: string;
  code?: string;
  description?: string;
  priority?: number;
  status?: 'active' | 'inactive';
}

/**
 * Get all roles with optional filtering and pagination
 */
export async function getRoles(options?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ roles: Role[]; total: number }> {
  const { search, status, limit = 100, offset = 0 } = options || {};

  // Build where conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(roles.name, `%${search}%`),
        like(roles.code, `%${search}%`),
        like(roles.description, `%${search}%`)
      )!
    );
  }
  
  if (status) {
    conditions.push(eq(roles.status, status));
  }
  
  // Exclude soft-deleted roles
  conditions.push(isNull(roles.deletedAt));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(roles)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;

  // Get roles
  const rolesList = await db
    .select()
    .from(roles)
    .where(whereClause)
    .orderBy(desc(roles.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    roles: rolesList,
    total,
  };
}

/**
 * Get a single role by ID
 */
export async function getRoleById(id: string): Promise<Role | null> {
  const result = await db
    .select()
    .from(roles)
    .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  return result[0];
}

/**
 * Get role with user count
 */
export async function getRoleWithUserCount(id: string) {
  const role = await getRoleById(id);
  if (!role) {
    return null;
  }
  
  const userCount = await getRoleUserCount(id);
  
  return {
    ...role,
    userCount,
  };
}

/**
 * Create a new role
 */
export async function createRole(data: CreateRoleInput, createdBy: string): Promise<Role> {
  const result = await db
    .insert(roles)
    .values({
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || null,
      isSystem: data.isSystem || false,
      priority: data.priority || 0,
      status: data.status || 'active',
      createdBy,
    })
    .returning();
  
  return result[0];
}

/**
 * Update a role
 */
export async function updateRole(
  id: string,
  data: UpdateRoleInput,
  updatedBy: string
): Promise<Role | null> {
  const existing = await getRoleById(id);
  if (!existing) {
    return null;
  }
  
  // Prevent updating system roles' code and isSystem flag
  if (existing.isSystem && (data.code !== undefined || data.isSystem !== undefined)) {
    throw new Error('Cannot modify system role code or system flag');
  }
  
  const updateData: Partial<NewRole> = {
    updatedBy,
    updatedAt: new Date(),
  };
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.code !== undefined) {
    updateData.code = data.code.toUpperCase();
  }
  
  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }
  
  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  const result = await db
    .update(roles)
    .set(updateData)
    .where(eq(roles.id, id))
    .returning();
  
  return result[0] || null;
}

/**
 * Delete a role (soft delete)
 */
export async function deleteRole(id: string, deletedBy: string): Promise<boolean> {
  const existing = await getRoleById(id);
  if (!existing) {
    return false;
  }
  
  // Prevent deleting system roles
  if (existing.isSystem) {
    throw new Error('Cannot delete system roles');
  }
  
  // Check if role has users assigned
  const userCount = await getRoleUserCount(id);
  if (userCount > 0) {
    throw new Error(`Cannot delete role: ${userCount} user(s) are assigned to this role`);
  }
  
  // Soft delete
  await db
    .update(roles)
    .set({
      deletedAt: new Date(),
      updatedBy: deletedBy,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id));
  
  return true;
}

/**
 * Get count of users with a specific role
 */
export async function getRoleUserCount(roleId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.roleId, roleId), isNull(users.deletedAt)));
  
  return result[0]?.count || 0;
}

