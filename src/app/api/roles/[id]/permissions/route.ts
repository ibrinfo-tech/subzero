import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { roles, rolePermissions } from '@/core/lib/db/baseSchema';
import { getRolePermissions, updateRoleModulePermissions } from '@/core/lib/services/rolePermissionsService';
import { eq } from 'drizzle-orm';

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

    const permissionsData = await getRolePermissions(roleId);

    return NextResponse.json({
      success: true,
      role: {
        id: role[0].id,
        name: role[0].name,
        code: role[0].code,
      },
      modulePermissions: permissionsData.modules,
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
    const modulesPayload = Array.isArray(body.modules) ? body.modules : [];
    const legacyPermissionIds = Array.isArray(body.permissionIds) ? body.permissionIds : null;

    const isValidDataAccess = (value: unknown): value is 'none' | 'own' | 'team' | 'all' =>
      value === 'none' || value === 'own' || value === 'team' || value === 'all';

    let collectedPermissionIds: string[] = [];

    // Update module-level, data-level, and field-level permissions when provided
    for (const moduleData of modulesPayload) {
      if (!moduleData?.moduleId) {
        continue;
      }

      const permissionsArray = Array.isArray(moduleData.permissions) ? moduleData.permissions : [];
      const fieldsArray = Array.isArray(moduleData.fields) ? moduleData.fields : [];

      const hasAccess = typeof moduleData.hasAccess === 'boolean'
        ? moduleData.hasAccess
        : permissionsArray.some((p: any) => p?.granted);

      const dataAccess = isValidDataAccess(moduleData.dataAccess)
        ? moduleData.dataAccess
        : hasAccess
          ? 'team'
          : 'none';

      const normalizedPermissions = permissionsArray
        .filter((p: any) => p?.permissionId)
        .map((p: any) => ({
          permissionId: p.permissionId as string,
          granted: Boolean(p.granted),
        }));

      const normalizedFields = fieldsArray
        .filter((f: any) => f?.fieldId)
        .map((f: any) => ({
          fieldId: f.fieldId as string,
          isVisible: Boolean(f.isVisible),
          isEditable: Boolean(f.isEditable) && Boolean(f.isVisible),
        }));

      const grantedPermissionIds = normalizedPermissions
        .filter((p: { permissionId: string; granted: boolean }) => p.granted)
        .map((p: { permissionId: string; granted: boolean }) => p.permissionId);

      collectedPermissionIds.push(...grantedPermissionIds);

      await updateRoleModulePermissions(
        roleId,
        moduleData.moduleId as string,
        {
          hasAccess,
          dataAccess,
          permissions: normalizedPermissions,
          fields: normalizedFields,
        },
        userId,
      );
    }

    // Always keep legacy role_permissions table in sync for current auth checks
    const finalPermissionIds = Array.from(
      new Set([
        ...(legacyPermissionIds ?? []),
        ...collectedPermissionIds,
      ]),
    );

    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (finalPermissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        finalPermissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          conditions: null,
        })),
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
