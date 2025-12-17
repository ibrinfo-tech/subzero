import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createNote } from '../../services/notesService';
import { createNoteSchema } from '../../schemas/notesValidation';

/**
 * POST /api/notes
 * Create a new note
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

    const canCreate = await userHasPermission(userId, 'notes:create', tenantId);
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden: missing notes:create' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateRequest(createNoteSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const note = await createNote({
      data: validation.data,
      tenantId,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: note,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


