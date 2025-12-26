// API endpoint for getting unread notification count

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { getUnreadCount } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getUserTenantId(userId);
    
    // tenantId is optional - only required in multi-tenant mode
    const { MULTI_TENANT_ENABLED } = await import('@/core/lib/db/baseSchema');
    if (MULTI_TENANT_ENABLED && !tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const count = await getUnreadCount(userId, tenantId || undefined);

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unread count';
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

