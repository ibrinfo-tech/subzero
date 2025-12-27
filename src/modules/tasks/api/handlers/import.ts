import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createTask } from '../../services/taskService';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    // Parse headers
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    // Map headers to task fields
    const titleIndex = headers.findIndex((h) => h.toLowerCase() === 'title');
    const descriptionIndex = headers.findIndex((h) => h.toLowerCase() === 'description');
    const statusIndex = headers.findIndex((h) => h.toLowerCase() === 'status');
    const priorityIndex = headers.findIndex((h) => h.toLowerCase() === 'priority');
    const dueDateIndex = headers.findIndex((h) => h.toLowerCase() === 'due date');

    if (titleIndex === -1) {
      return NextResponse.json({ error: 'CSV must contain a "Title" column' }, { status: 400 });
    }

    // Parse rows
    const imported: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

      const title = values[titleIndex];
      if (!title) {
        errors.push(`Row ${i + 1}: Title is required`);
        continue;
      }

      try {
        const task = await createTask({
          data: {
            sectionId: '',
            projectId: '',
            title,
            description: values[descriptionIndex] || undefined,
            status: (values[statusIndex] as any) || 'todo',
            priority: (values[priorityIndex] as any) || 'normal',
            dueDate: values[dueDateIndex] || undefined,
          },
          tenantId,
          userId,
        });

        imported.push(task.id);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Failed to import'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: imported.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Task import error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

