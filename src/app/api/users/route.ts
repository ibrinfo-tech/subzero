import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/permissions';
import { getUsers } from '@/core/lib/services/usersService';

/**
 * GET /api/users
 * Get all users (with optional filtering)
 * Requires: users:read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    // Check permission
    const permissionMiddleware = requirePermission('users:read');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const roleId = searchParams.get('roleId') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get users
    const result = await getUsers({
      search,
      roleId,
      status,
      limit,
      offset,
    });
    
    return NextResponse.json(
      {
        success: true,
        data: result.users,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 * Requires: users:create permission
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Check permission
    const permissionMiddleware = requirePermission('users:create');
    const permissionResult = await permissionMiddleware(request);
    
    if (permissionResult instanceof NextResponse) {
      return permissionResult; // Forbidden response
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { validateRequest } = await import('@/core/middleware/validation');
    const { createUserSchema } = await import('@/core/lib/validations/users');
    const validation = validateRequest(createUserSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if user already exists
    const { db } = await import('@/core/lib/db');
    const { users } = await import('@/core/lib/db/baseSchema');
    const { eq } = await import('drizzle-orm');
    
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Create user
    const { createUser } = await import('@/core/lib/services/usersService');
    const user = await createUser(data, userId);
    
    // Create auth provider entry for password authentication
    const { authProviders } = await import('@/core/lib/db/baseSchema');
    await db.insert(authProviders).values({
      userId: user.id,
      provider: 'password',
    } as any);
    
    // Return user data (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
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

