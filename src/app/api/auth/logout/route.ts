import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logout endpoint - clears auth cookie
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  // Clear auth token cookie
  response.cookies.delete('auth-token');
  
  return response;
}

