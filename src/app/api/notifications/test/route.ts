// API endpoint for creating test notifications

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { createNotification } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getUserTenantId(userId);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      type = 'info',
      title,
      message,
      category = 'test',
      priority = 'normal',
    } = body;

    // Create a test notification
    const notification = await createNotification({
      tenantId,
      userId,
      title: title || `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message:
        message ||
        `This is a test ${type} notification created at ${new Date().toLocaleString()}`,
      type: type as 'info' | 'success' | 'warning' | 'error',
      category,
      actionUrl: '/profile',
      actionLabel: 'View Profile',
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
      metadata: {
        test: true,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Test notification created',
      notification,
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create test notification';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

