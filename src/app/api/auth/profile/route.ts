import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { users } from '@/core/lib/db/baseSchema';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserRole, getUserPermissionsWithModules } from '@/core/lib/permissions';
import { eq } from 'drizzle-orm';

/**
 * GET /api/auth/profile
 * Get current user profile with roles and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        isEmailVerified: users.isEmailVerified,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult[0];
    
    // Get user role and permissions
    const role = await getUserRole(userId);
    const permissions = await getUserPermissionsWithModules(userId);
    
    return NextResponse.json(
      { 
        user: {
          ...user,
          role: role ? [role] : [], // Return as array for backward compatibility
          roles: role ? [role] : [], // Alias for backward compatibility
          permissions,
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
