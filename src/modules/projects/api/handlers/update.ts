import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { updateProject } from '../../services/projectsService';
import { updateProjectSchema } from '../../schemas/projectsValidation';

/**
 * PATCH /api/projects/:id
 * Update an existing project
 */
export async function PATCH(
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

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    const canUpdate = await userHasPermission(userId, 'projects:update', tenantId);
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden: missing projects:update' }, { status: 403 });
    }

    const projectId = params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 });
    }

    const body = await request.json();
    const validation = validateRequest(updateProjectSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const updated = await updateProject({
      projectId,
      tenantId,
      userId,
      data: validation.data,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


