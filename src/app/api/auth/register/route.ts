import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { registerSchema } from '@/core/lib/validations/auth';
import { hashPassword } from '@/core/lib/utils';
import { validateRequest } from '@/core/middleware/validation';
import { isRegistrationEnabled } from '@/core/config/authConfig';
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
    
    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: name || null,
      })
      .returning();
    
    const user = newUser[0];
    
    // Generate token (user ID as token for demo)
    // In production, use JWT or session tokens
    const token = user.id.toString();
    
    // Create response with user data (without password) and token
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      { status: 201 }
    );
    
    // Set token in HTTP-only cookie for middleware access
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
