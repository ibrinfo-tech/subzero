import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listProjects } from '../../services/projectService';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    // tenantId can be null in single-tenant mode - that's OK

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const myProjects = searchParams.get('myProjects') === 'true';
    const archived = searchParams.get('archived') === 'true' ? true : searchParams.get('archived') === 'false' ? false : undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const filters = {
      search,
      status: status as any,
      priority: priority as any,
      ownerId: ownerId as any,
      myProjects,
      archived,
      startDate,
      endDate,
    };

    const records = await listProjects(tenantId, userId, filters);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error('Project list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

