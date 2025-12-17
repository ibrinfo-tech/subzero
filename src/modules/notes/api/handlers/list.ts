import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listNotesForTenant } from '../../services/notesService';

/**
 * GET /api/notes
 * List notes for the authenticated user's tenant
 */
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

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const pinnedParam = searchParams.get('pinned');

    let isPinned: boolean | undefined;
    if (pinnedParam === 'true') {
      isPinned = true;
    } else if (pinnedParam === 'false') {
      isPinned = false;
    }
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    const page = pageParam ? Number(pageParam) || 1 : 1;
    const pageSize = pageSizeParam ? Number(pageSizeParam) || 20 : 20;

    const offset = (page - 1) * pageSize;

    const { notes, total } = await listNotesForTenant({
      tenantId,
      search,
      status,
      isPinned,
      limit: pageSize,
      offset,
    });

    return NextResponse.json(
      {
        success: true,
        data: notes,
        pagination: {
          page,
          pageSize,
          total,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('List notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


