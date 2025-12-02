import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { getRoleWithUserCount, updateRole, deleteRole } from '@/core/lib/services/rolesService';
import { db } from '@/core/lib/db';
import { Role, roles } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/roles/:id
 * Get a single role by ID
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
      return authResult; // Unauthorized response
    }
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:read');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    const { id } = await params;
    
    // Get role
    const result = await getRoleWithUserCount(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get role by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/roles/:id
 * Update a role
 * Requires: roles:update permission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:update');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    const { id } = await params;
    
    // Parse and validate request body
    const body = await request.json();
    const { validateRequest } = await import('@/core/middleware/validation');
    const { updateRoleSchema } = await import('@/core/lib/validations/roles');
    const validation = validateRequest(updateRoleSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if code is being changed and if it's already taken
    if (data.code) {
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.code, data.code.toUpperCase()))
        .limit(1);
      
      if (existingRole.length > 0 && existingRole[0].id !== id) {
        return NextResponse.json(
          { error: 'Role code already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update role
    try {
      const role = await updateRole(id, data, userId);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        {
          success: true,
          data: role,
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles/:id
 * Delete a role (soft delete)
 * Requires: roles:delete permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('roles:delete');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    const { id } = await params;
    
    // Delete role
    try {
      const success = await deleteRole(id, userId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        {
          success: true,
          message: 'Role deleted successfully',
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

