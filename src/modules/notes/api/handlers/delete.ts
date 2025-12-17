import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { deleteNote } from '../../services/notesService';

/**
 * DELETE /api/notes/:id
 * Soft delete a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    const canDelete = await userHasPermission(userId, 'notes:delete', tenantId);
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: missing notes:delete' }, { status: 403 });
    }

    const noteId = params.id;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID format' }, { status: 400 });
    }

    const deleted = await deleteNote(noteId, tenantId, userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Note deleted successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


