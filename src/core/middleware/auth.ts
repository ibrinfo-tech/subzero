import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/core/lib/tokens';

/**
 * Extract token from request headers, cookies, or query parameters
 */
export function getAuthToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // console.log('[Auth] Token found in Authorization header');
    return authHeader.substring(7);
  }
  
  // Fallback to cookie
  const cookieToken = request.cookies.get('access-token')?.value;
  if (cookieToken) {
    // console.log('[Auth] Token found in cookie');
    return cookieToken;
  }
  
  // Fallback to query parameter (for SSE/EventSource which doesn't support custom headers)
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  if (queryToken) {
    // console.log('[Auth] Token found in query parameter');
    return queryToken;
  }
  
  // console.log('[Auth] No token found in headers, cookies, or query');
  return null;
}

/**
 * Auth middleware to verify user authentication using access tokens
 * Returns user ID if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const token = getAuthToken(request);
  
  if (!token) {
    console.log('[Auth] verifyAuth failed: no token');
    return null;
  }
  
  // console.log('[Auth] Verifying token:', token.substring(0, 20) + '...');
  
  // Verify token against database
  const userId = await verifyAccessToken(token);
  
  if (userId) {
    // console.log('[Auth] Token verified successfully for user:', userId);
  } else {
    console.log('[Auth] Token verification failed');
  }
  
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


