import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listTasksForTenant } from '../../services/tasksService';

/**
 * GET /api/tasks
 * List tasks for the authenticated user's tenant
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

    // Extract filter parameters from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;

    const taskList = await listTasksForTenant(tenantId, {
      search,
      status,
      priority,
    });

    return NextResponse.json(
      {
        success: true,
        data: taskList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


