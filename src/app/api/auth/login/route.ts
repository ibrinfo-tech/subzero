import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { loginSchema } from '@/core/lib/validations/auth';
import { verifyPassword } from '@/core/lib/utils';
import { validateRequest } from '@/core/middleware/validation';
import { generateAccessToken, generateRefreshToken } from '@/core/lib/tokens';
import { USE_NON_EXPIRING_TOKENS } from '@/core/config/tokenConfig';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/login
 * Login endpoint with email and password
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(loginSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    
    // Find user by email
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        fullName: users.fullName,
        isEmailVerified: users.isEmailVerified,
        tenantId: users.tenantId,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const user = userResult[0];
    
    // Check if user has a password (might be OAuth-only user)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate access and refresh tokens (non-expiring if configured)
    const { token: accessToken, expiresAt: accessExpiresAt } = await generateAccessToken(
      user.id,
      USE_NON_EXPIRING_TOKENS
    );
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await generateRefreshToken(
      user.id,
      USE_NON_EXPIRING_TOKENS
    );
    
    console.log('[Login] Tokens generated:', {
      userId: user.id,
      email: user.email,
      nonExpiring: USE_NON_EXPIRING_TOKENS,
      accessExpiresAt,
      refreshExpiresAt,
    });
    
    // Create response with user data (without password) and tokens
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: user.isEmailVerified,
          tenantId: user.tenantId,
        },
        accessToken,
        refreshToken,
        expiresAt: accessExpiresAt.toISOString(),
      },
      { status: 200 }
    );
    
    // Set tokens in HTTP-only cookies
    // If non-expiring tokens are enabled, set cookie maxAge to a very long time (10 years)
    const cookieMaxAge = USE_NON_EXPIRING_TOKENS 
      ? 60 * 60 * 24 * 365 * 10 // 10 years
      : 60 * 15; // 15 minutes
    
    const refreshCookieMaxAge = USE_NON_EXPIRING_TOKENS
      ? 60 * 60 * 24 * 365 * 10 // 10 years
      : 60 * 60 * 24 * 7; // 7 days
    
    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });
    
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: refreshCookieMaxAge,
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

