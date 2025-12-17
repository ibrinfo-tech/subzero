import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listProjectsForTenant } from '../../services/projectsService';

/**
 * GET /api/projects
 * List projects for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    // Extract filter and sort parameters from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const labelId = searchParams.get('labelId') || undefined;
    const sortField = searchParams.get('sortField') as any || undefined;
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | undefined;

    const projectList = await listProjectsForTenant(tenantId, {
      search,
      status,
      priority,
      labelId,
      sortField,
      sortDirection,
    });

    return NextResponse.json(
      {
        success: true,
        data: projectList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


