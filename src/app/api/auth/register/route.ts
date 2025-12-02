import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users, authProviders, tenants } from '@/core/lib/db/baseSchema';
import { registerSchema } from '@/core/lib/validations/auth';
import { hashPassword } from '@/core/lib/utils';
import { validateRequest } from '@/core/middleware/validation';
import { isRegistrationEnabled } from '@/core/config/authConfig';
import { generateAccessToken, generateRefreshToken } from '@/core/lib/tokens';
import { USE_NON_EXPIRING_TOKENS } from '@/core/config/tokenConfig';
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
    
    // Get or create default tenant for self-registered users
    let defaultTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'default'))
      .limit(1);
    
    let tenantId: string;
    
    if (defaultTenant.length === 0) {
      // Create default tenant if it doesn't exist
      console.log('[Register] Creating default tenant for self-registered users');
      const newTenant = await db
        .insert(tenants)
        .values({
          name: 'Default Organization',
          slug: 'default',
          status: 'active',
          plan: 'free',
          maxUsers: 100,
          metadata: {},
        })
        .returning();
      tenantId = newTenant[0].id;
    } else {
      tenantId = defaultTenant[0].id;
    }
    
    // Get default "User" role for new registrations
    const defaultRole = await getDefaultUserRole(tenantId);
    
    if (!defaultRole) {
      console.error('Default "USER" role not found. Please run seed script.');
      return NextResponse.json(
        { error: 'System configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        fullName: name || null,
        isEmailVerified: false,
        status: 'active',
        tenantId: tenantId,
        twoFactorEnabled: false,
        failedLoginAttempts: 0,
        timezone: 'UTC',
        locale: 'en',
        metadata: {},
      })
      .returning();
    
    const user = newUser[0];
    
    // Create auth provider entry for password authentication
    await db.insert(authProviders).values({
      userId: user.id,
      provider: 'password',
    });
    
    // Assign default role to user
    const { userRoles } = await import('@/core/lib/db/baseSchema');
    await db.insert(userRoles).values({
      userId: user.id,
      roleId: defaultRole,
      tenantId: tenantId,
      grantedBy: user.id, // Self-assigned
      isActive: true,
      metadata: {},
    });
    
    // Generate access and refresh tokens (non-expiring if configured)
    const { token: accessToken, expiresAt: accessExpiresAt } = await generateAccessToken(
      user.id,
      USE_NON_EXPIRING_TOKENS
    );
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await generateRefreshToken(
      user.id,
      USE_NON_EXPIRING_TOKENS
    );
    
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
