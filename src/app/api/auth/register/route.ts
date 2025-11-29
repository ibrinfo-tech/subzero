import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users, authProviders } from '@/core/lib/db/baseSchema';
import { registerSchema } from '@/core/lib/validations/auth';
import { hashPassword } from '@/core/lib/utils';
import { validateRequest } from '@/core/middleware/validation';
import { isRegistrationEnabled } from '@/core/config/authConfig';
import { generateAccessToken, generateRefreshToken } from '@/core/lib/tokens';
import { getDefaultUserRole } from '@/core/lib/roles';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/register
 * Registration endpoint with email, password, and name
 */
export async function POST(request: NextRequest) {
  // Check if registration is enabled
  if (!isRegistrationEnabled()) {
    return NextResponse.json(
      { error: 'Registration is currently disabled' },
      { status: 403 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(registerSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { email, password, name } = validation.data;
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Get default "User" role for new registrations
    const defaultRoleId = await getDefaultUserRole();
    
    if (!defaultRoleId) {
      console.error('Default "USER" role not found. Please run seed script.');
      return NextResponse.json(
        { error: 'System configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    // Create new user with default "User" role
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        fullName: name || null,
        isEmailVerified: false,
        roleId: defaultRoleId,
        roleAssignedAt: new Date(),
        status: 'active',
      })
      .returning();
    
    const user = newUser[0];
    
    // Create auth provider entry for password authentication
    await db.insert(authProviders).values({
      userId: user.id,
      provider: 'password',
    });
    
    // Generate access and refresh tokens
    const { token: accessToken, expiresAt: accessExpiresAt } = await generateAccessToken(user.id);
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await generateRefreshToken(user.id);
    
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
      { status: 201 }
    );
    
    // Set tokens in HTTP-only cookies
    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });
    
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
