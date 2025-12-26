// API endpoint for marking all notifications as read

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { markAllAsRead } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';

export async function POST(request: NextRequest) {
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

    await markAllAsRead(userId, tenantId || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

