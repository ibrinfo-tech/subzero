import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { createNoteSchema } from '../../schemas/notesValidation';
import { createNote } from '../../services/notesService';

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(createNoteSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { title, content } = validation.data;
    
    // Create note
    const note = await createNote({
      title,
      content,
      userId,
    });
    
    return NextResponse.json(
      {
        success: true,
        data: note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

