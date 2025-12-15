import { NextRequest, NextResponse } from 'next/server';
import { createTaskSchema } from '@/modules/tasks/schemas/tasksValidation';
import { createTask } from '@/modules/tasks/services/tasksService';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const projectId = params.id;
  const parsed = createTaskSchema.safeParse({ ...body, projectId });
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

  const task = await createTask({
    // Always enforce the projectId coming from the route param
    data: { ...parsed.data, projectId },
    tenantId,
    userId,
  });
  return NextResponse.json({ data: task }, { status: 201 });
}

