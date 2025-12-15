import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createProject } from '../../services/projectsService';
import { createProjectSchema } from '../../schemas/projectsValidation';

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
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

    const canCreate = await userHasPermission(userId, 'projects:create', tenantId);
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden: missing projects:create' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateRequest(createProjectSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const project = await createProject({
      data: validation.data,
      tenantId,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create project error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isDatabaseError = errorMessage.includes('violates') || errorMessage.includes('constraint') || errorMessage.includes('foreign key');
    
    return NextResponse.json(
      { 
        error: isDatabaseError ? 'Database error: ' + errorMessage : errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}


