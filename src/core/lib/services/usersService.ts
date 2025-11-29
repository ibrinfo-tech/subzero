import { db } from '@/core/lib/db';
import { users, roles } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, isNull, desc, count } from 'drizzle-orm';
import type { User, NewUser } from '@/core/lib/db/baseSchema';
import { hashPassword } from '@/core/lib/utils';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  roleId?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateUserInput {
  email?: string;
  fullName?: string;
  roleId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  password?: string;
}

/**
 * Get all users with optional filtering and pagination
 */
export async function getUsers(options?: {
  search?: string;
  roleId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: User[]; total: number }> {
  const { search, roleId, status, limit = 100, offset = 0 } = options || {};

  // Build where conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(users.email, `%${search}%`),
        like(users.fullName, `%${search}%`)
      )!
    );
  }
  
  if (roleId) {
    conditions.push(eq(users.roleId, roleId));
  }
  
  if (status) {
    conditions.push(eq(users.status, status));
  }
  
  // Exclude soft-deleted users
  conditions.push(isNull(users.deletedAt));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);
  
  const total = totalResult[0]?.count || 0;

  // Get users with role information
  const usersList = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      roleId: users.roleId,
      email: users.email,
      passwordHash: users.passwordHash,
      isEmailVerified: users.isEmailVerified,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      status: users.status,
      roleAssignedAt: users.roleAssignedAt,
      roleAssignedBy: users.roleAssignedBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      deletedAt: users.deletedAt,
      createdBy: users.createdBy,
      updatedBy: users.updatedBy,
      roleId_role: roles.id,
      roleName: roles.name,
      roleCode: roles.code,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  // Transform to match User type
  const transformedUsers = usersList.map((u: any) => ({
    id: u.id,
    tenantId: u.tenantId,
    roleId: u.roleId,
    email: u.email,
    passwordHash: u.passwordHash,
    isEmailVerified: u.isEmailVerified,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    status: u.status,
    roleAssignedAt: u.roleAssignedAt,
    roleAssignedBy: u.roleAssignedBy,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    deletedAt: u.deletedAt,
    createdBy: u.createdBy,
    updatedBy: u.updatedBy,
  }));

  return {
    users: transformedUsers,
    total,
  };
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  return result[0];
}

/**
 * Get user with role information
 */
export async function getUserWithRole(id: string) {
  const result = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      roleId: users.roleId,
      email: users.email,
      passwordHash: users.passwordHash,
      isEmailVerified: users.isEmailVerified,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      status: users.status,
      roleAssignedAt: users.roleAssignedAt,
      roleAssignedBy: users.roleAssignedBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      deletedAt: users.deletedAt,
      createdBy: users.createdBy,
      updatedBy: users.updatedBy,
      roleId_role: roles.id,
      roleName: roles.name,
      roleCode: roles.code,
      roleDescription: roles.description,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const row = result[0];
  return {
    user: {
      id: row.id,
      tenantId: row.tenantId,
      roleId: row.roleId,
      email: row.email,
      passwordHash: row.passwordHash,
      isEmailVerified: row.isEmailVerified,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      status: row.status,
      roleAssignedAt: row.roleAssignedAt,
      roleAssignedBy: row.roleAssignedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
    },
    role: row.roleId_role ? {
      id: row.roleId_role,
      name: row.roleName || '',
      code: row.roleCode || '',
      description: row.roleDescription || null,
    } : null,
  };
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput, createdBy: string): Promise<User> {
  const hashedPassword = await hashPassword(data.password);
  
  const result = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      roleId: data.roleId || null,
      status: data.status || 'active',
      isEmailVerified: false,
      roleAssignedAt: data.roleId ? new Date() : null,
      roleAssignedBy: data.roleId ? createdBy : null,
      createdBy,
    })
    .returning();
  
  return result[0];
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  data: UpdateUserInput,
  updatedBy: string
): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) {
    return null;
  }
  
  const updateData: Partial<NewUser> = {
    updatedBy,
    updatedAt: new Date(),
  };
  
  if (data.email !== undefined) {
    updateData.email = data.email;
  }
  
  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName;
  }
  
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  if (data.roleId !== undefined) {
    updateData.roleId = data.roleId || null;
    updateData.roleAssignedAt = data.roleId ? new Date() : null;
    updateData.roleAssignedBy = data.roleId ? updatedBy : null;
  }
  
  if (data.password !== undefined) {
    updateData.passwordHash = await hashPassword(data.password);
  }
  
  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();
  
  return result[0] || null;
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(id: string, deletedBy: string): Promise<boolean> {
  const existing = await getUserById(id);
  if (!existing) {
    return false;
  }
  
  // Soft delete
  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      updatedBy: deletedBy,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
  
  return true;
}

/**
 * Get count of users with a specific role
 */
export async function getUserCountByRole(roleId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.roleId, roleId), isNull(users.deletedAt)));
  
  return result[0]?.count || 0;
}

