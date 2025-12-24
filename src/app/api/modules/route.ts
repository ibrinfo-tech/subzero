import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { eq, inArray } from 'drizzle-orm';

/**
 * GET /api/modules
 * Get all modules with their permissions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Get all active modules
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

    // Group permissions by module
    const modulesWithPermissions = allModules.map(module => {
      const moduleCode = module.code.toLowerCase();
      const modulePerms = allPermissions.filter(p => p.module === moduleCode);

      return {
        id: module.id,
        name: module.name,
        code: module.code,
        description: module.description,
        icon: module.icon,
        sortOrder: module.sortOrder,
        isActive: module.isActive,
        permissions: modulePerms.map(perm => ({
          id: perm.id,
          code: perm.code,
          name: perm.name,
          action: perm.action,
          resource: perm.resource,
          isDangerous: perm.isDangerous,
          requiresMfa: perm.requiresMfa,
          description: perm.description,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      modules: modulesWithPermissions,
    });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/modules
 * Update module(s) - primarily to disable/enable modules
 * Body: { modules: [{ id: string, isActive?: boolean, ... }] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission - only super admin or users with settings:update can modify modules
    const hasPermission = await userHasPermission(userId, 'settings:update') || 
                          await userHasPermission(userId, 'admin:*');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - settings:update or admin:* permission required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { modules: modulesToUpdate } = body;

    if (!Array.isArray(modulesToUpdate) || modulesToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request - modules array is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const updatePromises = modulesToUpdate.map(async (moduleUpdate: any) => {
      if (!moduleUpdate.id) {
        throw new Error('Module ID is required');
      }

      const updateData: any = {
        updatedAt: now,
        updatedBy: userId,
      };

      // Allow updating isActive, sortOrder, name, description, icon
      if (typeof moduleUpdate.isActive === 'boolean') {
        updateData.isActive = moduleUpdate.isActive;
      }
      if (typeof moduleUpdate.sortOrder === 'number') {
        updateData.sortOrder = moduleUpdate.sortOrder;
      }
      if (typeof moduleUpdate.name === 'string') {
        updateData.name = moduleUpdate.name;
      }
      if (typeof moduleUpdate.description === 'string' || moduleUpdate.description === null) {
        updateData.description = moduleUpdate.description;
      }
      if (typeof moduleUpdate.icon === 'string' || moduleUpdate.icon === null) {
        updateData.icon = moduleUpdate.icon;
      }

      await db
        .update(modules)
        .set(updateData)
        .where(eq(modules.id, moduleUpdate.id));
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Modules updated successfully',
    });
  } catch (error) {
    console.error('Update modules error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

