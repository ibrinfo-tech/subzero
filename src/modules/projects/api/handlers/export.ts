import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listProjects } from '../../services/projectService';
import type { ProjectListFilters } from '../../types';

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
    const filters: ProjectListFilters = body.filters || {};

    // Fetch all projects matching filters
    const projects = await listProjects(tenantId, userId, filters);

    // Build CSV headers
    const headers = [
      'Name',
      'Description',
      'Status',
      'Priority',
      'Start Date',
      'End Date',
      'Owner ID',
      'Progress',
      'Created By',
      'Created At',
      'Updated At',
    ];

    // Build CSV rows
    const rows = projects.map((project) => [
      project.name,
      project.description || '',
      project.status,
      project.priority,
      project.startDate || '',
      project.endDate || '',
      project.ownerId || '',
      project.progress.toString(),
      project.createdBy,
      project.createdAt,
      project.updatedAt,
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
        'Content-Disposition': `attachment; filename="projects-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Project export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

