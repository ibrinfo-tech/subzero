import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { updateTask } from '../../services/tasksService';
import { updateTaskSchema } from '../../schemas/tasksValidation';

/**
 * PATCH /api/tasks/:id
 * Update an existing task
 */
export async function PATCH(
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

    const canUpdate = await userHasPermission(userId, 'tasks:update', tenantId);
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden: missing tasks:update' }, { status: 403 });
    }

    const taskId = params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID format' }, { status: 400 });
    }

    const body = await request.json();
    const validation = validateRequest(updateTaskSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const updated = await updateTask({
      taskId,
      tenantId,
      userId,
      data: validation.data,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


