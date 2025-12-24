import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { isUserSuperAdmin } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { tenants } from '@/core/lib/db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * GET /api/tenants/:id
 * Get a single tenant by ID
 * Requires: Super Admin only
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
    
    const userId = authResult;
    
    // Check if user is Super Admin
    const isSuperAdmin = await isUserSuperAdmin(userId);
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only Super Admin can access tenant management' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .limit(1);
    
    if (tenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: tenant[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get tenant by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tenants/:id
 * Update a tenant
 * Requires: Super Admin only
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
    
    // Check if user is Super Admin
    const isSuperAdmin = await isUserSuperAdmin(userId);
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only Super Admin can update tenants' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Check if tenant exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .limit(1);
    
    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, slug, status, plan, maxUsers, trialEndsAt, settings, metadata } = body;
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) {
      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
          { status: 400 }
        );
      }
      
      // Check if slug already exists (excluding current tenant)
      const slugExists = await db
        .select()
        .from(tenants)
        .where(and(eq(tenants.slug, slug), isNull(tenants.deletedAt)))
        .limit(1);
      
      if (slugExists.length > 0 && slugExists[0].id !== id) {
        return NextResponse.json(
          { error: 'Tenant with this slug already exists' },
          { status: 409 }
        );
      }
      
      updateData.slug = slug;
    }
    if (status !== undefined) updateData.status = status;
    if (plan !== undefined) updateData.plan = plan;
    if (maxUsers !== undefined) updateData.maxUsers = maxUsers;
    if (trialEndsAt !== undefined) updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
    if (settings !== undefined) updateData.settings = settings;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    // Update tenant
    const updatedTenant = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, id))
      .returning();
    
    return NextResponse.json(
      {
        success: true,
        data: updatedTenant[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tenants/:id
 * Delete a tenant (soft delete)
 * Requires: Super Admin only
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
    
    // Check if user is Super Admin
    const isSuperAdmin = await isUserSuperAdmin(userId);
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only Super Admin can delete tenants' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Check if tenant exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .limit(1);
    
    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Soft delete tenant
    await db
      .update(tenants)
      .set({ deletedAt: new Date() })
      .where(eq(tenants.id, id));
    
    return NextResponse.json(
      {
        success: true,
        message: 'Tenant deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

