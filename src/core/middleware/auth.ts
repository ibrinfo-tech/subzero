import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract token from request headers
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Auth middleware to verify user authentication
 * Returns user ID if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<number | null> {
  const token = getAuthToken(request);
  
  if (!token) {
    return null;
  }
  
  // Simple token verification - in production use JWT or session tokens
  // For now, token is just the user ID encoded
  try {
    const userId = parseInt(token, 10);
    if (isNaN(userId)) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

/**
 * Create auth middleware for protected routes
 */
export function requireAuth() {
  return async (request: NextRequest): Promise<NextResponse | number> => {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return userId;
  };
}


