import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken, revokeRefreshToken } from '@/core/lib/tokens';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const refreshToken = 
      request.cookies.get('refresh-token')?.value ||
      (await request.json()).refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Revoke old refresh token (token rotation)
    await revokeRefreshToken(refreshToken);

    // Generate new access and refresh tokens
    const { token: newAccessToken, expiresAt: accessExpiresAt } = await generateAccessToken(userId);
    const { token: newRefreshToken, expiresAt: refreshExpiresAt } = await generateRefreshToken(userId);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: accessExpiresAt.toISOString(),
      },
      { status: 200 }
    );

    // Set new tokens in HTTP-only cookies
    response.cookies.set('access-token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

