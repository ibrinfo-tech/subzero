import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { deleteTask } from '../../services/tasksService';

/**
 * DELETE /api/tasks/:id
 * Soft delete a task
 */
export async function DELETE(
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

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    const canDelete = await userHasPermission(userId, 'tasks:delete', tenantId);
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: missing tasks:delete' }, { status: 403 });
    }

    const taskId = params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID format' }, { status: 400 });
    }

    const deleted = await deleteTask(taskId, tenantId, userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Task deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


