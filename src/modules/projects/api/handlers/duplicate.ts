import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { getProjectById, createProject } from '../../services/projectsService';
import type { CreateProjectInput } from '../../schemas/projectsValidation';

/**
 * POST /api/projects/:id/duplicate
 * Duplicate an existing project
 */
export async function POST(
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

    const canDuplicate =
      (await userHasPermission(userId, 'projects:duplicate', tenantId)) ||
      (await userHasPermission(userId, 'projects:*', tenantId));
    if (!canDuplicate) {
      return NextResponse.json({ error: 'Forbidden: missing projects:duplicate' }, { status: 403 });
    }

    const projectId = params.id;
    const existingProject = await getProjectById(projectId, tenantId);

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create duplicate with modified title
    const duplicateData: CreateProjectInput = {
      title: `${existingProject.title} (Copy)`,
      description: existingProject.description ?? undefined,
      projectType: existingProject.projectType ?? undefined,
      status: 'open', // Reset status to open
      priority: existingProject.priority ?? undefined,
      startDate: existingProject.startDate
        ? typeof existingProject.startDate === 'string'
          ? existingProject.startDate
          : new Date(existingProject.startDate).toISOString().split('T')[0]
        : undefined,
      deadline: existingProject.deadline
        ? typeof existingProject.deadline === 'string'
          ? existingProject.deadline
          : new Date(existingProject.deadline).toISOString().split('T')[0]
        : undefined,
      estimatedHours: existingProject.estimatedHours ? Number(existingProject.estimatedHours) : undefined,
      budgetAmount: existingProject.budgetAmount ? Number(existingProject.budgetAmount) : undefined,
      price: existingProject.price ? Number(existingProject.price) : undefined,
      currency: existingProject.currency ?? undefined,
      progressPercentage: 0, // Reset progress
      billingType: existingProject.billingType ?? undefined,
      isBillable: existingProject.isBillable ?? undefined,
      labelIds: existingProject.labelIds ?? undefined,
      customFields: existingProject.customFields ?? undefined,
      settings: existingProject.settings ?? undefined,
      notes: existingProject.notes ?? undefined,
    };

    const newProject = await createProject({
      data: duplicateData,
      tenantId,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: newProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Duplicate project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

