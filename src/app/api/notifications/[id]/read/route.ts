// API endpoint for marking a notification as read

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { markAsRead } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = await getUserTenantId(userId);

    // tenantId is optional - only required in multi-tenant mode
    const { MULTI_TENANT_ENABLED } = await import('@/core/lib/db/baseSchema');
    if (MULTI_TENANT_ENABLED && !tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    await markAsRead(id, userId, tenantId || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

