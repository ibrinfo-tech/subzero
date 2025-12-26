import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { listLeadsForTenant } from '../../services/leadService';

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

    // Check permission
    const hasPermission = await userHasPermission(userId, 'leads:read', tenantId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const source = searchParams.get('source') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const labelIds = searchParams.get('labelIds')?.split(',').filter(Boolean) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await listLeadsForTenant(tenantId, {
      search,
      status,
      source,
      ownerId,
      labelIds,
      page,
      pageSize,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lead list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


