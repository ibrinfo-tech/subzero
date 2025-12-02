import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { roles, permissions, rolePermissions, modules } from '@/core/lib/db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * GET /api/roles/:id/permissions
 * Get all permissions for a specific role grouped by module
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, 'roles:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - roles:read permission required' },
        { status: 403 }
      );
    }

    const { id: roleId } = await params;

    // Get role
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Get all modules
    const allModules = await db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true))
      .orderBy(modules.sortOrder);

    // Get all permissions
    const allPermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.isActive, true));

    // Get role's assigned permissions
    const assignedPermissions = await db
      .select({
        permissionId: rolePermissions.permissionId,
        permissionCode: permissions.code,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    const assignedPermissionIds = new Set(assignedPermissions.map(p => p.permissionId));

    // Group permissions by module
    const modulePermissionsMap = new Map();

    for (const module of allModules) {
      const moduleCode = module.code.toLowerCase();
      const modulePerms = allPermissions.filter(p => p.module === moduleCode);

      if (modulePerms.length > 0) {
        modulePermissionsMap.set(module.id, {
          moduleId: module.id,
          moduleName: module.name,
          moduleCode: module.code,
          icon: module.icon,
          permissions: modulePerms.map(perm => ({
            id: perm.id,
            code: perm.code,
            name: perm.name,
            action: perm.action,
            resource: perm.resource,
            isDangerous: perm.isDangerous,
            requiresMfa: perm.requiresMfa,
            description: perm.description,
            granted: assignedPermissionIds.has(perm.id),
          })),
        });
      }
    }

    const modulePermissions = Array.from(modulePermissionsMap.values());

    return NextResponse.json({
      success: true,
      role: {
        id: role[0].id,
        name: role[0].name,
        code: role[0].code,
      },
      modulePermissions,
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/:id/permissions
 * Update permissions for a role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission
    const hasPermission = await userHasPermission(userId, 'roles:update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - roles:update permission required' },
        { status: 403 }
      );
    }

    const { id: roleId } = await params;
    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'permissionIds must be an array' },
        { status: 400 }
      );
    }

    // Delete existing permissions
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Insert new permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map(permissionId => ({
          roleId,
          permissionId,
          conditions: null,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
