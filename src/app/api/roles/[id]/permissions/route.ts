import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { getRolePermissions, getRoleModulePermissions } from '@/core/lib/services/rolePermissionsService';

/**
 * GET /api/roles/:id/permissions
 * Get all permissions for a role
 * Requires: roles:read permission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params;
    
    const permissions = await getRolePermissions(id);
    
    return NextResponse.json(
      {
        success: true,
        data: permissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get role permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

