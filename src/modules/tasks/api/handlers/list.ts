import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listTasks } from '../../services/taskService';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // tenantId can be null in single-tenant mode - that's OK

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const dueDate = searchParams.get('dueDate') || undefined;
    const overdue = searchParams.get('overdue') === 'true';

    const filters = {
      search,
      status: status as any,
      priority: priority as any,
      assignedTo: assignedTo as any,
      projectId: projectId as any,
      dueDate,
      overdue,
    };

    const records = await listTasks(tenantId, userId, filters);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Task list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

