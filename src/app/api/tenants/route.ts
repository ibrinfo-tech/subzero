import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { isUserSuperAdmin } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { tenants, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, isNull, sql } from 'drizzle-orm';
import { withCoreRouteLogging } from '@/core/lib/api/coreRouteLogger';

/**
 * GET /api/tenants
 * Get all tenants
 * Requires: Super Admin only
 */
export async function GET(request: NextRequest) {
  return withCoreRouteLogging(request, async (req) => {
  try {
    // Check if multi-tenancy is enabled
    if (!MULTI_TENANT_ENABLED || !tenants) {
      return NextResponse.json(
        { error: 'Multi-tenancy is not enabled' },
        { status: 404 }
      );
    }

    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(req);
    
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    
    // Build query conditions
    const conditions = [isNull(tenants.deletedAt)];
    
    if (search) {
      conditions.push(
        or(
          like(tenants.name, `%${search}%`),
          like(tenants.slug, `%${search}%`)
        )!
      );
    }
    
    if (status) {
      conditions.push(eq(tenants.status, status));
    }
    
    // Get tenants
    const tenantsList = await db
      .select()
      .from(tenants)
      .where(and(...conditions))
      .orderBy(tenants.createdAt)
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(and(...conditions));
    
    const total = Number(totalResult[0]?.count || 0);
    
    return NextResponse.json(
      {
        success: true,
        data: tenantsList,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List tenants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants
 * Create a new tenant
 * Requires: Super Admin only
 */
export async function POST(request: NextRequest) {
  return withCoreRouteLogging(request, async (req) => {
  try {
    // Check if multi-tenancy is enabled
    if (!MULTI_TENANT_ENABLED || !tenants) {
      return NextResponse.json(
        { error: 'Multi-tenancy is not enabled' },
        { status: 404 }
      );
    }

    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(req);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check if user is Super Admin
    const isSuperAdmin = await isUserSuperAdmin(userId);
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only Super Admin can create tenants' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, slug, status, plan, maxUsers, trialEndsAt, settings, metadata } = body;
    
    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }
    
    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.slug, slug), isNull(tenants.deletedAt)))
      .limit(1);
    
    if (existingTenant.length > 0) {
      return NextResponse.json(
        { error: 'Tenant with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Create tenant
    const newTenant = await db
      .insert(tenants)
      .values({
        name,
        slug,
        status: status || 'active',
        plan: plan || 'free',
        maxUsers: maxUsers || 10,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        settings: settings || {},
        metadata: metadata || {},
      })
      .returning();
    
    return NextResponse.json(
      {
        success: true,
        data: newTenant[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

