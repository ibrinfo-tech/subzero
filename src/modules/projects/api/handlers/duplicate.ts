import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { getProjectById, createProject } from '../../services/projectService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get original project
    const originalProject = await getProjectById(projectId, tenantId, userId);

    if (!originalProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create duplicate with "Copy of" prefix
    const duplicatedProject = await createProject({
      data: {
        name: `Copy of ${originalProject.name}`,
        description: originalProject.description || undefined,
        status: 'planned', // Reset status to planned
        priority: originalProject.priority,
        startDate: originalProject.startDate || undefined,
        endDate: originalProject.endDate || undefined,
        ownerId: originalProject.ownerId || undefined,
        teamMemberIds: originalProject.teamMemberIds || undefined,
        relatedEntityType: originalProject.relatedEntityType || undefined,
        relatedEntityId: originalProject.relatedEntityId || undefined,
        progress: 0, // Reset progress
        labelIds: originalProject.labelIds || undefined,
        customFields: originalProject.customFields,
      },
      tenantId,
      userId,
    });

    return NextResponse.json({ success: true, data: duplicatedProject }, { status: 201 });
  } catch (error) {
    console.error('Project duplicate error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

