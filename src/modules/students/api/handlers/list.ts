import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listStudentsForTenant } from '../../services/studentsService';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const course = searchParams.get('course') || undefined;
    const semester = searchParams.get('semester') || undefined;

    const students = await listStudentsForTenant(tenantId, {
      search,
      status,
      course,
      semester,
    });

    return NextResponse.json(
      {
        success: true,
        data: students,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('List students error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


