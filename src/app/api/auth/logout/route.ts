import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/core/middleware/auth';
import { revokeAccessToken, revokeRefreshToken, revokeAllUserTokens } from '@/core/lib/tokens';
import { verifyAccessToken } from '@/core/lib/tokens';
import { withCoreRouteLogging } from '@/core/lib/api/coreRouteLogger';

/**
 * POST /api/auth/logout
 * Logout endpoint - revokes current tokens
 */
export async function POST(request: NextRequest) {
  return withCoreRouteLogging(request, async (req) => {
  try {
    const accessToken = getAuthToken(req);
    const refreshToken = req.cookies.get('refresh-token')?.value;

    // Revoke tokens if they exist
    if (accessToken) {
      await revokeAccessToken(accessToken);
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Optionally revoke all user tokens (for security)
    if (accessToken) {
      const userId = await verifyAccessToken(accessToken);
      if (userId) {
        // Uncomment to revoke all tokens on logout
        // await revokeAllUserTokens(userId);
      }
    }

    // Create response and clear cookies
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear cookies
    response.cookies.delete('access-token');
    response.cookies.delete('refresh-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  });
}
