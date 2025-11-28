import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getNotesByUserId } from '../../services/notesService';

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Get notes for user
    const notes = await getNotesByUserId(userId);
    
    return NextResponse.json(
      {
        success: true,
        data: notes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

