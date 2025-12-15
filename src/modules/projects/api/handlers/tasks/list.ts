import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { tasks } from '@/modules/tasks/schemas/tasksSchema';
import { verifyAuth } from '@/core/middleware/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = params.id;
  const result = await db
    .select()
    .from(tasks)
    // Filter only by projectId + not-deleted; project row itself is already tenant-scoped
    .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt));
  return NextResponse.json({ data: result });
}

