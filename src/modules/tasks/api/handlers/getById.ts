import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { getTaskById } from '../../services/taskService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // tenantId can be null in single-tenant mode - that's OK

    const taskId = params.id;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const record = await getTaskById(taskId, tenantId, userId);

    if (!record) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch (error) {
    console.error('Task getById error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

