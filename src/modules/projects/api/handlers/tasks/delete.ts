import { NextRequest, NextResponse } from 'next/server';
import { deleteTask } from '@/modules/tasks/services/tasksService';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = await getUserTenantId(userId);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
  }
  const ok = await deleteTask(params.taskId, tenantId, userId);
  if (!ok) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

