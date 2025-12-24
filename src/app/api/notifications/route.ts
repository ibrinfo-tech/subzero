// API endpoint for fetching user notifications

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserNotifications } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getUserTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category') || undefined;

    const userNotifications = await getUserNotifications(userId, tenantId, {
      limit,
      offset,
      unreadOnly,
      category,
    });

    return NextResponse.json({
      success: true,
      data: userNotifications,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

