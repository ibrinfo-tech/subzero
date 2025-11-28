import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { deleteNote } from '../../services/notesService';

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    const noteId = parseInt(params.id, 10);
    
    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }
    
    // Delete note
    const deleted = await deleteNote(noteId, userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Note deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

