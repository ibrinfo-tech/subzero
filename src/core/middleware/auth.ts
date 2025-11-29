import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/core/lib/tokens';

/**
 * Extract token from request headers or cookies
 */
export function getAuthToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to cookie
  const cookieToken = request.cookies.get('access-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

/**
 * Auth middleware to verify user authentication using access tokens
 * Returns user ID if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const token = getAuthToken(request);
  
  if (!token) {
    return null;
  }
  
  // Verify token against database
  const userId = await verifyAccessToken(token);
  return userId;
}

/**
 * Create auth middleware for protected routes
 */
export function requireAuth() {
  return async (request: NextRequest): Promise<NextResponse | string> => {
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


