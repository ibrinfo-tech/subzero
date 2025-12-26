import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { getTaskById, createTask } from '../../services/taskService';

export async function POST(
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

    // Get original task
    const originalTask = await getTaskById(taskId, tenantId, userId);

    if (!originalTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create duplicate with "Copy of" prefix
    const duplicatedTask = await createTask({
      data: {
        title: `Copy of ${originalTask.title}`,
        description: originalTask.description || undefined,
        status: 'todo', // Reset status to todo
        priority: originalTask.priority,
        dueDate: originalTask.dueDate || undefined,
        assignedTo: originalTask.assignedTo || undefined,
        relatedEntityType: originalTask.relatedEntityType || undefined,
        relatedEntityId: originalTask.relatedEntityId || undefined,
        customFields: originalTask.customFields,
      },
      tenantId,
      userId,
    });

    return NextResponse.json({ success: true, data: duplicatedTask }, { status: 201 });
  } catch (error) {
    console.error('Task duplicate error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

