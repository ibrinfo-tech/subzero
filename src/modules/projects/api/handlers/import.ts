import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createProject } from '../../services/projectService';

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

    // Map headers to project fields
    const nameIndex = headers.findIndex((h) => h.toLowerCase() === 'name');
    const descriptionIndex = headers.findIndex((h) => h.toLowerCase() === 'description');
    const statusIndex = headers.findIndex((h) => h.toLowerCase() === 'status');
    const priorityIndex = headers.findIndex((h) => h.toLowerCase() === 'priority');
    const startDateIndex = headers.findIndex((h) => h.toLowerCase() === 'start date');
    const endDateIndex = headers.findIndex((h) => h.toLowerCase() === 'end date');
    const ownerIdIndex = headers.findIndex((h) => h.toLowerCase() === 'owner id');
    const progressIndex = headers.findIndex((h) => h.toLowerCase() === 'progress');

    if (nameIndex === -1) {
      return NextResponse.json({ error: 'CSV must contain a "Name" column' }, { status: 400 });
    }

    // Parse rows
    const imported: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

      const name = values[nameIndex];
      if (!name) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      try {
        const project = await createProject({
          data: {
            name,
            description: values[descriptionIndex] || undefined,
            status: (values[statusIndex] as any) || 'planned',
            priority: (values[priorityIndex] as any) || 'normal',
            startDate: values[startDateIndex] || undefined,
            endDate: values[endDateIndex] || undefined,
            ownerId: values[ownerIdIndex] || undefined,
            progress: values[progressIndex] ? parseInt(values[progressIndex], 10) : undefined,
          },
          tenantId,
          userId,
        });

        imported.push(project.id);
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
    console.error('Project import error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

