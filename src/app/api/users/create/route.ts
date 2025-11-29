import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users, authProviders } from '@/core/lib/db/baseSchema';
import { verifyAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { hashPassword } from '@/core/lib/utils';
import { getDefaultUserRole } from '@/core/lib/roles';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Schema for creating a user
 */
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  roleId: z.string().uuid().optional(), // Optional - defaults to USER role if not provided
});

/**
 * POST /api/users/create
 * Create a new user (admin only)
 * Requires: USER_CREATE permission
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has USER_CREATE permission
    const hasPermission = await userHasPermission(userId, 'USER_CREATE');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions. USER_CREATE permission required.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, roleId } = validation.data;

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

    // Get role ID - use provided roleId or default to USER role
    let finalRoleId = roleId;
    if (!finalRoleId) {
      finalRoleId = await getDefaultUserRole();
      if (!finalRoleId) {
        console.error('Default "USER" role not found. Please run seed script.');
        return NextResponse.json(
          { error: 'System configuration error. Default role not found.' },
          { status: 500 }
        );
      }
    }

    // Create new user with role assigned
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        fullName: fullName || null,
        isEmailVerified: false,
        roleId: finalRoleId,
        roleAssignedAt: new Date(),
        roleAssignedBy: userId, // Track who assigned the role
        status: 'active',
        createdBy: userId, // Track who created the user
      })
      .returning();

    const user = newUser[0];

    // Create auth provider entry for password authentication
    await db.insert(authProviders).values({
      userId: user.id,
      provider: 'password',
    });

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: user.isEmailVerified,
          roleId: user.roleId,
          tenantId: user.tenantId,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

