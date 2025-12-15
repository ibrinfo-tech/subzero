import { NextRequest, NextResponse } from 'next/server';
import { updateTaskSchema } from '@/modules/tasks/schemas/tasksValidation';
import { updateTask } from '@/modules/tasks/services/tasksService';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const body = await request.json();
  const projectId = params.id;
  const parsed = updateTaskSchema.safeParse({ ...body, projectId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.message }, { status: 400 });
  }
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = await getUserTenantId(userId);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
  }

  const task = await updateTask({
    taskId: params.taskId,
    tenantId,
    userId,
    // Force the projectId to the route param so the association cannot be lost
    data: { ...parsed.data, projectId },
  });
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ data: task });
}

