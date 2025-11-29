import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { 
  getRoleModulePermissions, 
  updateRoleModulePermissions,
  getModulePermissions,
  getModuleFields 
} from '@/core/lib/services/rolePermissionsService';

/**
 * GET /api/roles/:id/permissions/:moduleId
 * Get permissions for a specific role and module
 * Requires: roles:read permission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:read');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult;
    }
    
    const { id, moduleId } = await params;
    
    // Get role module permissions
    const roleModulePerms = await getRoleModulePermissions(id, moduleId);
    
    // Get all available permissions for this module
    const availablePermissions = await getModulePermissions(moduleId);
    
    // Get all available fields for this module
    const availableFields = await getModuleFields(moduleId);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          roleModulePermissions: roleModulePerms,
          availablePermissions,
          availableFields,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get role module permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/roles/:id/permissions/:moduleId
 * Update permissions for a specific role and module
 * Requires: roles:update permission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:update');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult;
    }
    
    const { id, moduleId } = await params;
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (typeof body.hasAccess !== 'boolean') {
      return NextResponse.json(
        { error: 'hasAccess is required and must be a boolean' },
        { status: 400 }
      );
    }
    
    if (!['none', 'own', 'team', 'all'].includes(body.dataAccess)) {
      return NextResponse.json(
        { error: 'dataAccess must be one of: none, own, team, all' },
        { status: 400 }
      );
    }
    
    // Update permissions
    await updateRoleModulePermissions(
      id,
      moduleId,
      {
        hasAccess: body.hasAccess,
        dataAccess: body.dataAccess,
        permissions: body.permissions || [],
        fields: body.fields || [],
      },
      userId
    );
    
    return NextResponse.json(
      {
        success: true,
        message: 'Permissions updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update role module permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

