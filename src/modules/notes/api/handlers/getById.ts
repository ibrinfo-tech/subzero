import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getNoteById } from '../../services/notesService';

/**
 * GET /api/notes/:id
 * Get a single note by ID
 */
export async function GET(
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
    
    // Get note
    const note = await getNoteById(noteId, userId);
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: note,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

