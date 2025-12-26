import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listTasks } from '../../services/taskService';
import type { TaskListFilters } from '../../types';

export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // tenantId can be null in single-tenant mode - that's OK

    const body = await request.json().catch(() => ({}));
    const filters: TaskListFilters = body.filters || {};

    // Fetch all tasks matching filters
    const tasks = await listTasks(tenantId, userId, filters);

    // Build CSV headers
    const headers = [
      'Title',
      'Description',
      'Status',
      'Priority',
      'Due Date',
      'Assigned To',
      'Created By',
      'Created At',
      'Updated At',
    ];

    // Build CSV rows
    const rows = tasks.map((task) => [
      task.title,
      task.description || '',
      task.status,
      task.priority,
      task.dueDate || '',
      task.assignedTo || '',
      task.createdBy,
      task.createdAt,
      task.updatedAt,
    ]);

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Task export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

